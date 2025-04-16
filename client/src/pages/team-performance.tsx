import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { ObjectiveWithDetails, Team, Timeframe, User, KeyResult } from "@/types/custom-types";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { cn } from "@/lib/utils";

// Colors for the charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function TeamPerformance() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  
  // Fetch data
  const { data: objectives, isLoading: isLoadingObjectives } = useQuery<ObjectiveWithDetails[]>({
    queryKey: ['/api/objectives'],
  });
  
  const { data: teams, isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });
  
  const { data: timeframes, isLoading: isLoadingTimeframes } = useQuery<Timeframe[]>({
    queryKey: ['/api/timeframes'],
  });
  
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  const { data: keyResults, isLoading: isLoadingKeyResults } = useQuery<KeyResult[]>({
    queryKey: ['/api/key-results'],
  });
  
  // Loading state
  const isLoading = isLoadingObjectives || isLoadingTeams || isLoadingTimeframes || isLoadingUsers || isLoadingKeyResults;
  
  // Filter objectives by selected timeframe
  const filteredObjectives = useMemo(() => {
    if (!objectives) return [];
    
    return objectives.filter(objective => 
      (selectedTimeframe === "all" || objective.timeframeId === parseInt(selectedTimeframe))
    );
  }, [objectives, selectedTimeframe]);
  
  // Get team data for the selected team
  const selectedTeamData = useMemo(() => {
    if (selectedTeam === "all" || !teams) return null;
    
    return teams.find(team => team.id === parseInt(selectedTeam)) || null;
  }, [selectedTeam, teams]);
  
  // Get team objectives
  const teamObjectives = useMemo(() => {
    if (selectedTeam === "all" || !filteredObjectives) return filteredObjectives;
    
    return filteredObjectives.filter(objective => 
      objective.teamId === parseInt(selectedTeam)
    );
  }, [filteredObjectives, selectedTeam]);
  
  // Team performance metrics
  const teamPerformanceData = useMemo(() => {
    if (!teams || !filteredObjectives) return [];
    
    return teams.map((team, index) => {
      const teamObjs = filteredObjectives.filter(obj => obj.teamId === team.id);
      const totalProgress = teamObjs.reduce((sum, obj) => sum + obj.progress, 0);
      const avgProgress = teamObjs.length > 0 ? Math.round(totalProgress / teamObjs.length) : 0;
      
      // Calculate the number of objectives by status
      const onTrackCount = teamObjs.filter(obj => obj.status === 'on_track').length;
      const atRiskCount = teamObjs.filter(obj => obj.status === 'at_risk').length;
      const behindCount = teamObjs.filter(obj => obj.status === 'behind').length;
      
      return {
        id: team.id,
        name: team.name,
        description: team.description,
        progress: avgProgress,
        objectiveCount: teamObjs.length,
        onTrackCount,
        atRiskCount,
        behindCount,
        color: COLORS[index % COLORS.length]
      };
    }).filter(team => team.objectiveCount > 0);
  }, [teams, filteredObjectives]);
  
  // Team members data
  const teamMembers = useMemo(() => {
    if (selectedTeam === "all" || !users) return [];
    
    return users.filter(user => user.teamId === parseInt(selectedTeam));
  }, [selectedTeam, users]);
  
  // Status distribution for selected team
  const statusDistribution = useMemo(() => {
    if (!teamObjectives) return [];
    
    const onTrack = teamObjectives.filter(obj => obj.status === 'on_track').length;
    const atRisk = teamObjectives.filter(obj => obj.status === 'at_risk').length;
    const behind = teamObjectives.filter(obj => obj.status === 'behind').length;
    
    return [
      { name: 'On Track', value: onTrack, color: '#10B981' },
      { name: 'At Risk', value: atRisk, color: '#F59E0B' },
      { name: 'Behind', value: behind, color: '#EF4444' }
    ].filter(item => item.value > 0);
  }, [teamObjectives]);
  
  // Calculate average team progress
  const avgTeamProgress = useMemo(() => {
    if (selectedTeam === "all") {
      if (teamPerformanceData.length === 0) return 0;
      
      const totalProgress = teamPerformanceData.reduce((sum, team) => sum + team.progress, 0);
      return Math.round(totalProgress / teamPerformanceData.length);
    } else {
      const team = teamPerformanceData.find(t => t.id === parseInt(selectedTeam));
      return team?.progress || 0;
    }
  }, [teamPerformanceData, selectedTeam]);
  
  // Function to get progress trend indicator
  const getProgressIndicator = (progress: number) => {
    if (progress > 70) {
      return { icon: <ArrowUpRight className="h-4 w-4 text-green-500" />, text: "On track", color: "text-green-500" };
    } else if (progress > 40) {
      return { icon: <Minus className="h-4 w-4 text-amber-500" />, text: "At risk", color: "text-amber-500" };
    } else {
      return { icon: <ArrowDownRight className="h-4 w-4 text-red-500" />, text: "Behind", color: "text-red-500" };
    }
  };
  
  return (
    <DashboardLayout title="Team Performance">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="w-full md:w-48">
            <Label htmlFor="timeframe">Timeframe</Label>
            <Select
              disabled={isLoading}
              value={selectedTimeframe}
              onValueChange={setSelectedTimeframe}
            >
              <SelectTrigger id="timeframe">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Timeframes</SelectItem>
                {timeframes && timeframes.map(timeframe => (
                  <SelectItem key={timeframe.id} value={timeframe.id.toString()}>
                    {timeframe.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-48">
            <Label htmlFor="team">Team</Label>
            <Select
              disabled={isLoading}
              value={selectedTeam}
              onValueChange={setSelectedTeam}
            >
              <SelectTrigger id="team">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams && teams.map(team => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {selectedTeam === "all" ? "Teams Reporting" : "Team Progress"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {selectedTeam === "all" ? teamPerformanceData.length : `${avgTeamProgress}%`}
                  </div>
                  {selectedTeam !== "all" && (
                    <Progress value={avgTeamProgress} className="h-2 mt-2" />
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Objectives</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{teamObjectives.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {teamObjectives.filter(obj => obj.status === 'on_track').length} on track
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgTeamProgress}%</div>
                  <div className="flex items-center text-xs mt-1">
                    {getProgressIndicator(avgTeamProgress).icon}
                    <span className={cn("ml-1", getProgressIndicator(avgTeamProgress).color)}>
                      {getProgressIndicator(avgTeamProgress).text}
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Key Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {keyResults?.filter(kr => 
                      teamObjectives.some(obj => obj.id === kr.objectiveId)
                    ).length || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Charts and Team Data */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {selectedTeam === "all" ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Team Performance Comparison</CardTitle>
                    <CardDescription>Average progress by team</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {teamPerformanceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={teamPerformanceData}>
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip 
                            formatter={(value, name) => [`${value}%`, 'Progress']}
                            labelFormatter={(label) => `Team: ${label}`}
                          />
                          <Legend />
                          <Bar dataKey="progress" name="Progress %" fill="#3B82F6">
                            {teamPerformanceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center py-10 text-muted-foreground">
                        No team performance data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedTeamData?.name || 'Team'} Overview</CardTitle>
                    <CardDescription>{selectedTeamData?.description || 'Team performance details'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <div className="text-sm font-medium">Overall Progress</div>
                          <div className="text-sm font-medium">{avgTeamProgress}%</div>
                        </div>
                        <Progress value={avgTeamProgress} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 pt-2">
                        <div className="bg-green-50 rounded p-3 text-center">
                          <div className="text-green-600 text-xl font-bold">
                            {teamObjectives.filter(obj => obj.status === 'on_track').length}
                          </div>
                          <div className="text-xs text-green-700 mt-1">On Track</div>
                        </div>
                        
                        <div className="bg-amber-50 rounded p-3 text-center">
                          <div className="text-amber-600 text-xl font-bold">
                            {teamObjectives.filter(obj => obj.status === 'at_risk').length}
                          </div>
                          <div className="text-xs text-amber-700 mt-1">At Risk</div>
                        </div>
                        
                        <div className="bg-red-50 rounded p-3 text-center">
                          <div className="text-red-600 text-xl font-bold">
                            {teamObjectives.filter(obj => obj.status === 'behind').length}
                          </div>
                          <div className="text-xs text-red-700 mt-1">Behind</div>
                        </div>
                      </div>
                    </div>
                    
                    {teamMembers.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-sm font-semibold mb-3">Team Members</h3>
                        <div className="space-y-2">
                          {teamMembers.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                              <div>
                                <div className="font-medium">{member.firstName} {member.lastName}</div>
                                <div className="text-xs text-muted-foreground">{member.role}</div>
                              </div>
                              <div className="text-xs font-medium">
                                {filteredObjectives.filter(obj => obj.ownerId === member.id).length} objectives
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle>Objective Status Distribution</CardTitle>
                  <CardDescription>
                    {selectedTeam === "all" ? "All teams" : selectedTeamData?.name} objective status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {statusDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Count']} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center py-10 text-muted-foreground">
                      No status data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Team Objectives Table */}
            {teamObjectives.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedTeam === "all" ? "All Objectives" : `${selectedTeamData?.name} Objectives`}
                  </CardTitle>
                  <CardDescription>
                    {teamObjectives.length} objectives
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teamObjectives.map(objective => {
                      const objKeyResults = keyResults?.filter(kr => kr.objectiveId === objective.id) || [];
                      const owner = users?.find(user => user.id === objective.ownerId);
                      
                      return (
                        <div key={objective.id} className="border rounded-lg p-4">
                          <div className="flex justify-between mb-2">
                            <div>
                              <h3 className="font-medium">{objective.title}</h3>
                              <div className="text-sm text-muted-foreground">
                                Owner: {owner?.firstName} {owner?.lastName}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "px-2 py-1 text-xs rounded-full",
                                objective.status === 'on_track' ? "bg-green-100 text-green-800" :
                                objective.status === 'at_risk' ? "bg-amber-100 text-amber-800" :
                                "bg-red-100 text-red-800"
                              )}>
                                {objective.status === 'on_track' ? 'On Track' : 
                                 objective.status === 'at_risk' ? 'At Risk' : 'Behind'}
                              </span>
                              <span className="font-medium">{objective.progress}%</span>
                            </div>
                          </div>
                          
                          <Progress value={objective.progress} className="h-2 mb-3" />
                          
                          {objKeyResults.length > 0 && (
                            <div className="mt-3">
                              <h4 className="text-xs font-semibold mb-2">Key Results</h4>
                              <div className="space-y-2">
                                {objKeyResults.map(kr => (
                                  <div key={kr.id} className="text-xs">
                                    <div className="flex justify-between mb-1">
                                      <span>{kr.title}</span>
                                      <span>{kr.progress}%</span>
                                    </div>
                                    <Progress value={kr.progress} className="h-1" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}