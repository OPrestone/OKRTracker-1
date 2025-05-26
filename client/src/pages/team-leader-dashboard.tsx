import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, BarChart, Target, TrendingUp, Crown, Plus,
  Calendar, CheckCircle, Clock, AlertCircle, Star
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTeamLeader } from "@/hooks/use-team-leader";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Link } from "wouter";

export default function TeamLeaderDashboard() {
  const { user } = useAuth();
  const { isTeamLeader, leaderTeams, isLoading } = useTeamLeader();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your leadership dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isTeamLeader || !leaderTeams?.length) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <Crown className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Team Leadership Roles</h2>
            <p className="text-muted-foreground mb-4">
              You're not currently assigned as a team leader. When you become a team leader, 
              this dashboard will show your team's performance data and management tools.
            </p>
            <Link href="teams">
              <Button>View All Teams</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalMembers = leaderTeams.reduce((sum, team) => sum + team.memberCount, 0);
  const totalObjectives = leaderTeams.reduce((sum, team) => sum + team.objectiveCount, 0);
  const completedObjectives = leaderTeams.reduce((sum, team) => sum + team.completedObjectives, 0);
  const totalKeyResults = leaderTeams.reduce((sum, team) => sum + team.keyResultCount, 0);
  const completedKeyResults = leaderTeams.reduce((sum, team) => sum + team.completedKeyResults, 0);

  const overallProgress = totalObjectives > 0 ? Math.round((completedObjectives / totalObjectives) * 100) : 0;
  const keyResultProgress = totalKeyResults > 0 ? Math.round((completedKeyResults / totalKeyResults) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Crown className="h-8 w-8 text-yellow-500" />
              <h1 className="text-3xl font-bold">Team Leader Dashboard</h1>
            </div>
            <p className="text-muted-foreground">
              Managing {leaderTeams.length} team{leaderTeams.length !== 1 ? 's' : ''} with {totalMembers} total members
            </p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teams Led</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leaderTeams.length}</div>
              <p className="text-xs text-muted-foreground">
                {totalMembers} total members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Objectives</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalObjectives}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Progress value={overallProgress} className="flex-1 h-2" />
                <span>{overallProgress}% complete</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Key Results</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalKeyResults}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Progress value={keyResultProgress} className="flex-1 h-2" />
                <span>{keyResultProgress}% achieved</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overallProgress >= 80 ? 'Excellent' : overallProgress >= 60 ? 'Good' : overallProgress >= 40 ? 'Fair' : 'Needs Focus'}
              </div>
              <p className="text-xs text-muted-foreground">
                Based on objective completion
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Teams Overview */}
        <Tabs defaultValue="teams" className="space-y-6">
          <TabsList>
            <TabsTrigger value="teams">My Teams</TabsTrigger>
            <TabsTrigger value="members">Team Members</TabsTrigger>
            <TabsTrigger value="actions">Quick Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {leaderTeams.map((team) => {
                const teamProgress = team.objectiveCount > 0 
                  ? Math.round((team.completedObjectives / team.objectiveCount) * 100) 
                  : 0;

                return (
                  <Card key={team.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: team.color || '#3b82f6' }} />
                          <CardTitle className="text-lg">{team.name}</CardTitle>
                        </div>
                        <Badge variant="secondary">
                          <Crown className="h-3 w-3 mr-1" />
                          Leader
                        </Badge>
                      </div>
                      <CardDescription>{team.description || 'No description'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Team Stats */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{team.memberCount} members</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span>{team.objectiveCount} objectives</span>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Team Progress</span>
                          <span className="font-medium">{teamProgress}%</span>
                        </div>
                        <Progress value={teamProgress} className="h-2" />
                      </div>

                      {/* Objective Status */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{team.completedObjectives} completed</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-500" />
                          <span>{team.inProgressObjectives} active</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Link href={`teams/${team.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            View Team
                          </Button>
                        </Link>
                        <Link href={`teams/${team.id}/objectives/create`} className="flex-1">
                          <Button size="sm" className="w-full">
                            <Plus className="h-3 w-3 mr-1" />
                            Add Objective
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {leaderTeams.map((team) => (
                <Card key={team.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: team.color || '#3b82f6' }} />
                      {team.name} Team Members
                    </CardTitle>
                    <CardDescription>
                      {team.memberCount} members in your team
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {team.members?.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatarUrl} />
                            <AvatarFallback>
                              {member.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 
                               member.username?.[0]?.toUpperCase() || 
                               member.email?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {member.name || member.username || member.email}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {member.title || member.email}
                            </p>
                          </div>
                        </div>
                      )) || (
                        <p className="text-muted-foreground col-span-full text-center py-4">
                          No members found
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create Team Objective
                  </CardTitle>
                  <CardDescription>
                    Set new goals for your teams to work towards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="objectives/create">
                    <Button className="w-full">Create Objective</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Schedule Check-ins
                  </CardTitle>
                  <CardDescription>
                    Plan regular meetings with your team members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="meetings">
                    <Button className="w-full" variant="outline">Schedule Meeting</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    View Analytics
                  </CardTitle>
                  <CardDescription>
                    Deep dive into team performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="analytics">
                    <Button className="w-full" variant="outline">View Analytics</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}