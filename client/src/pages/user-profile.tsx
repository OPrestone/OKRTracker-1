import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Clock,
  MapPin,
  Phone,
  Briefcase,
  Medal,
  Activity,
  Edit,
  Settings,
  FileText,
  AtSign,
  Shield,
  Users,
  Star,
  TrendingUp,
  PlusCircle,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Objective, KeyResult, User as UserType, CheckIn, Team } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Types for the profile
interface KeyResultWithDetails extends KeyResult {
  title: string;
  progress: number;
}

interface ObjectiveWithKeyResults extends Objective {
  keyResults: KeyResultWithDetails[];
}

export default function UserProfile() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Modal states for different actions
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCreateObjectiveModal, setShowCreateObjectiveModal] = useState(false);
  const [showCreateCheckInModal, setShowCreateCheckInModal] = useState(false);
  
  // Fetch user details if needed
  const { data: userDetails, isLoading: userLoading } = useQuery<UserType>({
    queryKey: ["/api/users", user?.id],
    enabled: !!user
  });
  
  // Fetch user's objectives
  const { data: userObjectives, isLoading: objectivesLoading } = useQuery<Objective[]>({
    queryKey: ["/api/users", user?.id, "objectives"],
    enabled: !!user
  });
  
  // Fetch user's team
  const { data: userTeam, isLoading: teamLoading } = useQuery<Team>({
    queryKey: ["/api/teams", user?.teamId],
    enabled: !!user?.teamId
  });
  
  // Fetch check-ins
  const { data: checkIns, isLoading: checkInsLoading } = useQuery<CheckIn[]>({
    queryKey: ["/api/check-ins", "user", user?.id],
    enabled: !!user
  });
  
  // Helper function to determine progress color class based on value
  const getProgressColorClass = (progress: number | null | undefined): string => {
    if (!progress) return "text-gray-400";
    if (progress >= 76) return "text-green-600";
    if (progress >= 51) return "text-yellow-600";
    if (progress >= 26) return "text-orange-600";
    return "text-red-600";
  };

  // Helper function to get badge variant based on status
  const getStatusBadgeVariant = (status: string | null | undefined): "default" | "destructive" | "outline" | "secondary" => {
    if (!status) return "outline";
    
    switch(status.toLowerCase()) {
      case "on track": 
      case "on_track": 
        return "default";
      case "at risk":
      case "at_risk":
        return "outline";
      case "behind":
        return "destructive";
      case "completed":
        return "secondary";
      default: 
        return "outline";
    }
  };

  // Helper function to get status text
  const getStatusText = (status: string | null | undefined): string => {
    if (!status) return "Not Started";
    
    switch(status.toLowerCase()) {
      case "on_track": return "On Track";
      case "at_risk": return "At Risk";
      case "behind": return "Behind";
      case "completed": return "Completed";
      default: return status;
    }
  };

  // Navigate to objective detail page
  const handleViewObjective = (id: number) => {
    navigate(`/objective-detail/${id}`);
  };
  
  // Get user initials for avatar
  const getUserInitials = (): string => {
    if (!user) return "?";
    
    const firstInitial = user.firstName ? user.firstName.charAt(0) : "";
    const lastInitial = user.lastName ? user.lastName.charAt(0) : "";
    
    return (firstInitial + lastInitial).toUpperCase();
  };
  
  // Format date helper
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Prepare stats from actual data
  const stats = [
    { 
      name: "Objectives", 
      value: userObjectives?.length || 0,
      icon: <Target className="h-4 w-4 text-primary" /> 
    },
    { 
      name: "On Track", 
      value: userObjectives?.filter(obj => obj.progress && obj.progress >= 70).length || 0,
      icon: <CheckCircle className="h-4 w-4 text-green-500" /> 
    },
    { 
      name: "At Risk", 
      value: userObjectives?.filter(obj => obj.progress && obj.progress >= 40 && obj.progress < 70).length || 0,
      icon: <AlertCircle className="h-4 w-4 text-amber-500" /> 
    },
    { 
      name: "Behind", 
      value: userObjectives?.filter(obj => obj.progress && obj.progress < 40).length || 0,
      icon: <Activity className="h-4 w-4 text-red-500" /> 
    }
  ];
  
  // Form state for edit profile
  const [profileForm, setProfileForm] = useState({
    firstName: userDetails?.firstName || "",
    lastName: userDetails?.lastName || "",
    email: userDetails?.email || "",
    language: userDetails?.language || "en",
    role: userDetails?.role || "user"
  });

  // Update form when user details load
  useEffect(() => {
    if (userDetails) {
      setProfileForm({
        firstName: userDetails.firstName || "",
        lastName: userDetails.lastName || "",
        email: userDetails.email || "",
        language: userDetails.language || "en",
        role: userDetails.role || "user"
      });
    }
  }, [userDetails]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserType>) => {
      if (!user?.id) throw new Error("User ID not found");
      const res = await apiRequest("PUT", `/api/users/${user.id}`, data);
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      // Invalidate user queries to refetch the latest data
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      setShowEditProfileModal(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handler functions for form
  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  // Handler functions for the buttons
  const handleEditProfile = () => {
    setShowEditProfileModal(true);
  };
  
  const handleSettings = () => {
    toast({
      title: "Settings",
      description: "Settings functionality will be implemented soon.",
    });
    setShowSettingsModal(true);
  };
  
  const handleCreateObjective = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create objectives.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Create Objective",
      description: "Opening objective creation form.",
    });
    setShowCreateObjectiveModal(true);
    // Alternatively, navigate to the objective creation page
    // navigate("/create-objective");
  };
  
  const handleCreateCheckIn = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create check-ins.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Create Check-in",
      description: "Opening check-in creation form.",
    });
    setShowCreateCheckInModal(true);
  };
  
  const handleViewTeamDashboard = () => {
    if (userTeam) {
      navigate(`/team-dashboard/${userTeam.id}`);
    } else {
      toast({
        title: "No Team Found",
        description: "You are not currently assigned to a team.",
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardLayout title="My Profile">
      {/* Edit Profile Modal */}
      <Dialog open={showEditProfileModal} onOpenChange={setShowEditProfileModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information and profile details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProfileSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName"
                    name="firstName"
                    value={profileForm.firstName}
                    onChange={handleProfileInputChange}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName"
                    name="lastName"
                    value={profileForm.lastName}
                    onChange={handleProfileInputChange}
                    placeholder="Last name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={handleProfileInputChange}
                  placeholder="Email address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone"
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileInputChange}
                  placeholder="Phone number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input 
                  id="jobTitle"
                  name="jobTitle"
                  value={profileForm.jobTitle}
                  onChange={handleProfileInputChange}
                  placeholder="Job title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location"
                  name="location"
                  value={profileForm.location}
                  onChange={handleProfileInputChange}
                  placeholder="City, Country"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={profileForm.bio}
                  onChange={handleProfileInputChange}
                  placeholder="Tell us about yourself"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditProfileModal(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9" 
              onClick={handleSettings}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button 
              size="sm" 
              className="h-9" 
              onClick={handleEditProfile}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="overview" onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="objectives" className="gap-2">
            <Target className="h-4 w-4" />
            <span>Objectives</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Recent Activity</span>
            <span className="sm:hidden">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            <span>My Team</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Profile Card */}
            <Card className="md:col-span-1">
              <CardHeader className="text-center relative pb-0">
                <div className="absolute right-4 top-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full"
                    onClick={handleEditProfile}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mx-auto mb-3 mt-2">
                  {userLoading ? (
                    <Skeleton className="h-24 w-24 rounded-full" />
                  ) : (
                    <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                
                {userLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32 mx-auto" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-xl">
                      {user?.firstName} {user?.lastName}
                    </CardTitle>
                    <CardDescription className="text-md font-medium">
                      {user?.role || "Team Member"}
                    </CardDescription>
                  </>
                )}
                
                <div className="flex justify-center gap-1 mt-2">
                  <Badge variant="outline" className="bg-primary/5">
                    {userTeam?.name || (user?.teamId ? "Loading team..." : "No team assigned")}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="mt-4">
                <div className="space-y-4">
                  {userLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-full" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                        <span className="text-sm">{user?.email || "No email available"}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-3 text-muted-foreground" />
                        <span className="text-sm">{userTeam?.name || "No department assigned"}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-3 text-muted-foreground" />
                        <span className="text-sm">Joined {formatDate(user?.createdAt)}</span>
                      </div>
                    </>
                  )}
                  
                  <Separator />
                  
                  {/* Stats Cards */}
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2 text-primary" />
                      OKR Statistics
                    </h3>
                    
                    {objectivesLoading ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {stats.map((stat, index) => (
                          <div 
                            key={index} 
                            className="bg-muted/40 border border-border/40 p-3 rounded-lg flex flex-col items-center justify-center"
                          >
                            <div className="flex items-center gap-1 mb-1">
                              <div className="bg-background p-1 rounded-full">
                                {stat.icon}
                              </div>
                            </div>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <div className="text-xs text-muted-foreground">{stat.name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Right Panel */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Quick Overview</CardTitle>
                      <CardDescription>Your current OKR performance and recent activities</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href="#objectives">
                        View All
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {objectivesLoading ? (
                    <div className="p-6 space-y-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : userObjectives && userObjectives.length > 0 ? (
                    <div className="divide-y">
                      {[...Array(Math.min(3, userObjectives.length))].map((_, index) => {
                        if (!userObjectives || !userObjectives[index]) return null;
                        const objective = userObjectives[index];
                        return (
                          <div 
                            key={objective.id} 
                            className="p-4 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium">{objective.title}</h3>
                                  <Badge variant={getStatusBadgeVariant(objective.status)}>
                                    {getStatusText(objective.status)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                                  {objective.description || "No description available"}
                                </p>
                              </div>
                              <div className={`text-lg font-bold ${getProgressColorClass(objective.progress)}`}>
                                {objective.progress || 0}%
                              </div>
                            </div>
                            <Progress 
                              value={objective.progress || 0} 
                              className="h-2" 
                            />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="mt-2 p-0 h-auto text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => handleViewObjective(objective.id)}
                            >
                              View details
                              <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                      {userObjectives && userObjectives.length > 3 && (
                        <div className="p-3 text-center">
                          <Button variant="link" size="sm" asChild>
                            <a href="#objectives">
                              View all {userObjectives.length} objectives
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Target className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium mb-1">No objectives yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Get started by creating your first objective
                      </p>
                      <Button 
                        size="sm"
                        onClick={handleCreateObjective}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Objective
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Your latest updates and check-ins</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href="#activity">
                        View All
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {checkInsLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : checkIns && checkIns.length > 0 ? (
                    <div className="space-y-4">
                      {checkIns.slice(0, 4).map((checkIn, index) => (
                        <div key={checkIn.id || index} className="flex gap-3 items-start">
                          <div className={`p-2 rounded-full 
                            ${checkIn.progress && checkIn.progress > 70 
                              ? "bg-green-100 text-green-600" 
                              : checkIn.progress && checkIn.progress > 40 
                              ? "bg-amber-100 text-amber-600"
                              : "bg-red-100 text-red-600"}`
                          }>
                            {checkIn.progress && checkIn.progress > 70 
                              ? <CheckCircle className="h-4 w-4" />
                              : checkIn.progress && checkIn.progress > 40
                              ? <AlertCircle className="h-4 w-4" />
                              : <Activity className="h-4 w-4" />
                            }
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {checkIn.objectiveId ? "Objective" : "Key Result"} Check-in 
                              {checkIn.progress !== undefined && checkIn.progress !== null ? ` (${checkIn.progress}%)` : ""}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {checkIn.notes || "No notes provided"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(checkIn.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Clock className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium mb-1">No recent activity</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Check-ins and updates will appear here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Objectives Tab */}
        <TabsContent value="objectives" id="objectives">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Objectives</CardTitle>
                  <CardDescription>All your objectives and their progress</CardDescription>
                </div>
                <Button onClick={handleCreateObjective}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Objective
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {objectivesLoading ? (
                <div className="space-y-6">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : userObjectives && userObjectives.length > 0 ? (
                <div className="space-y-6">
                  {[...Array(userObjectives.length)].map((_, index) => {
                    if (!userObjectives || !userObjectives[index]) return null;
                    const objective = userObjectives[index];
                    return (
                      <div 
                        key={objective.id} 
                        className="p-4 border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all"
                        onClick={() => handleViewObjective(objective.id)}
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="text-lg font-medium">{objective.title}</h3>
                              <Badge variant={getStatusBadgeVariant(objective.status)}>
                                {getStatusText(objective.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {objective.description || "No description available"}
                            </p>
                            <div className="flex items-center text-xs text-muted-foreground gap-4">
                              <span className="flex items-center">
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                Q2 2024
                              </span>
                              <span className="flex items-center">
                                <Users className="h-3.5 w-3.5 mr-1" />
                                {userTeam?.name || "Personal"}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="text-2xl font-bold mb-1 flex items-center">
                              <span className={getProgressColorClass(objective.progress)}>
                                {objective.progress || 0}%
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">Progress</div>
                          </div>
                        </div>
                        
                        <div className="mb-4 w-full">
                          <Progress value={objective.progress || 0} className="h-2" />
                        </div>
                        
                        <div className="flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewObjective(objective.id)}
                          >
                            View Details
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Target className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No objectives found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    You currently don't have any objectives. Create your first objective to start tracking your progress.
                  </p>
                  <Button onClick={handleCreateObjective}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Objective
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Activity Tab */}
        <TabsContent value="activity" id="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your check-ins and updates over time</CardDescription>
            </CardHeader>
            <CardContent>
              {checkInsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : checkIns && checkIns.length > 0 ? (
                <div className="space-y-6">
                  {[...Array(checkIns.length)].map((_, index) => {
                    if (!checkIns || !checkIns[index]) return null;
                    const checkIn = checkIns[index];
                    return (
                      <div key={checkIn.id || index} className="flex gap-4 items-start p-4 border rounded-lg">
                        <div className={`p-3 rounded-full 
                          ${checkIn.progress && checkIn.progress > 70 
                            ? "bg-green-100 text-green-600" 
                            : checkIn.progress && checkIn.progress > 40 
                            ? "bg-amber-100 text-amber-600"
                            : "bg-red-100 text-red-600"}`
                        }>
                          {checkIn.progress && checkIn.progress > 70 
                            ? <CheckCircle className="h-5 w-5" />
                            : checkIn.progress && checkIn.progress > 40
                            ? <AlertCircle className="h-5 w-5" />
                            : <Activity className="h-5 w-5" />
                          }
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <div>
                              <h3 className="font-medium">
                                {checkIn.objectiveId ? "Objective" : "Key Result"} Check-in
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(checkIn.createdAt)}
                              </p>
                            </div>
                            {checkIn.progress !== undefined && checkIn.progress !== null && (
                              <Badge variant="outline" className="whitespace-nowrap">
                                Progress: {checkIn.progress}%
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm">
                            <p>{checkIn.notes || "No notes provided for this check-in."}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No activity yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    You haven't recorded any check-ins or updates yet. Start by checking in with your objectives or key results.
                  </p>
                  <Button onClick={handleCreateCheckIn}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Check-in
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Team Tab */}
        <TabsContent value="team" id="team">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {teamLoading ? (
                      <Skeleton className="h-6 w-32" />
                    ) : userTeam ? (
                      <>{userTeam.name} Team</>
                    ) : (
                      <>No Team Assigned</>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {teamLoading ? (
                      <Skeleton className="h-4 w-48 mt-1" />
                    ) : userTeam ? (
                      <>Your team members and their progress</>
                    ) : (
                      <>You are not currently assigned to any team</>
                    )}
                  </CardDescription>
                </div>
                {userTeam && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleViewTeamDashboard}
                  >
                    View Team Dashboard
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {teamLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : userTeam ? (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Team Information</h3>
                      <Badge variant="outline">{userTeam.name}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {userTeam.description || "No team description available"}
                    </p>
                    <div className="flex items-center text-sm text-muted-foreground gap-4">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        3 members
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="font-medium pt-2">Team Members</h3>
                  
                  <div className="grid gap-4">
                    <div className="flex items-center p-3 hover:bg-muted/30 transition-colors rounded-md">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback className="bg-primary/10 text-primary">JD</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium">John Doe</h4>
                            <p className="text-xs text-muted-foreground">Product Manager</p>
                          </div>
                          <div className="flex items-center">
                            <Badge className="mr-2">Team Lead</Badge>
                            <Badge variant="outline">3 objectives</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 hover:bg-muted/30 transition-colors rounded-md">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback className="bg-primary/10 text-primary">AS</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium">Alice Smith</h4>
                            <p className="text-xs text-muted-foreground">UX Designer</p>
                          </div>
                          <div>
                            <Badge variant="outline">2 objectives</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 hover:bg-muted/30 transition-colors rounded-md">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium">{user?.firstName} {user?.lastName}</h4>
                            <p className="text-xs text-muted-foreground">{user?.role || "Team Member"}</p>
                          </div>
                          <div>
                            <Badge variant="outline">{userObjectives?.length || 0} objectives</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Team Assigned</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    You are not currently assigned to any team. Contact your administrator to join a team.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}