import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Objective, KeyResult, Team, TimeframeWithCadence } from "@/types/custom-types";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

// Define custom types for the data we'll work with
type ObjectiveWithKeyResults = Objective & { keyResults: KeyResult[] };
type TeamProgress = {
  name: string;
  progress: number;
  objectiveCount: number;
  color: string;
};

// Define colors for the charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Reports() {
  const [timeframeId, setTimeframeId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("performance");
  
  // Fetch objectives, teams, and timeframes
  const { data: objectives, isLoading: isLoadingObjectives } = useQuery<Objective[]>({
    queryKey: ['/api/objectives'],
  });
  
  const { data: teams, isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });
  
  const { data: timeframes, isLoading: isLoadingTimeframes } = useQuery<TimeframeWithCadence[]>({
    queryKey: ['/api/timeframes'],
  });

  // Filter objectives by timeframe if selected
  const filteredObjectives = objectives?.filter(objective => 
    timeframeId === "all" || objective.timeframeId === parseInt(timeframeId)
  );
  
  // Prepare data for team performance chart
  const teamProgressData = teams?.map((team, index) => {
    const teamObjectives = filteredObjectives?.filter(obj => obj.teamId === team.id) || [];
    const totalProgress = teamObjectives.reduce((sum, obj) => sum + obj.progress, 0);
    const avgProgress = teamObjectives.length > 0 ? totalProgress / teamObjectives.length : 0;
    
    return {
      name: team.name,
      progress: Math.round(avgProgress),
      objectiveCount: teamObjectives.length,
      color: COLORS[index % COLORS.length]
    };
  }).filter(team => team.objectiveCount > 0) || [];
  
  // Prepare data for objective status distribution
  const objectiveStatusData = [
    { name: 'On Track', value: filteredObjectives?.filter(obj => obj.status === 'on_track').length || 0 },
    { name: 'At Risk', value: filteredObjectives?.filter(obj => obj.status === 'at_risk').length || 0 },
    { name: 'Behind', value: filteredObjectives?.filter(obj => obj.status === 'behind').length || 0 }
  ].filter(status => status.value > 0);
  
  // Calculate progress averages
  const overallProgress = filteredObjectives && filteredObjectives.length > 0
    ? Math.round(filteredObjectives.reduce((sum, obj) => sum + obj.progress, 0) / filteredObjectives.length)
    : 0;
  
  const isLoading = isLoadingObjectives || isLoadingTeams || isLoadingTimeframes;
  
  return (
    <DashboardLayout title="Reports & Analytics">
      <div className="space-y-6">
        <div className="flex items-center space-x-2 lg:space-x-4 mb-6">
          <div className="w-48">
            <Label htmlFor="timeframe">Timeframe</Label>
            <Select
              disabled={isLoading}
              value={timeframeId}
              onValueChange={setTimeframeId}
            >
              <SelectTrigger>
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
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="performance">Performance Overview</TabsTrigger>
            <TabsTrigger value="team">Team Reports</TabsTrigger>
            <TabsTrigger value="trends">Trends & Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{overallProgress}%</div>
                      <Progress value={overallProgress} className="h-2 mt-2" />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Objectives</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{filteredObjectives?.length || 0}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">On Track</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-500">
                        {filteredObjectives?.filter(obj => obj.status === 'on_track').length || 0}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-500">
                        {filteredObjectives?.filter(obj => obj.status === 'at_risk').length || 0}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Performance</CardTitle>
                      <CardDescription>
                        Average progress by team
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {teamProgressData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={teamProgressData}>
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip 
                              formatter={(value, name) => [`${value}%`, 'Progress']}
                              labelFormatter={(label) => `Team: ${label}`}
                            />
                            <Legend />
                            <Bar dataKey="progress" name="Progress %" fill="#3B82F6">
                              {teamProgressData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center py-10 text-muted-foreground">
                          No team data available for the selected timeframe
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Objective Status Distribution</CardTitle>
                      <CardDescription>
                        Status of all objectives
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {objectiveStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={objectiveStatusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={100}
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {objectiveStatusData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={
                                    entry.name === 'On Track' 
                                      ? '#10B981' 
                                      : entry.name === 'At Risk' 
                                        ? '#F59E0B' 
                                        : '#EF4444'
                                  } 
                                />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [value, 'Count']} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center py-10 text-muted-foreground">
                          No status data available for the selected timeframe
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="team" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {teams && teams.map(team => {
                  const teamObjectives = filteredObjectives?.filter(obj => obj.teamId === team.id) || [];
                  const avgProgress = teamObjectives.length > 0 
                    ? Math.round(teamObjectives.reduce((sum, obj) => sum + obj.progress, 0) / teamObjectives.length) 
                    : 0;
                  
                  return teamObjectives.length > 0 ? (
                    <Card key={team.id}>
                      <CardHeader>
                        <CardTitle>{team.name}</CardTitle>
                        <CardDescription>
                          {team.description || `Team performance overview`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <div className="flex justify-between mb-1">
                            <div className="text-sm font-medium">Average Progress</div>
                            <div className="text-sm font-medium">{avgProgress}%</div>
                          </div>
                          <Progress value={avgProgress} className="h-2" />
                        </div>
                        
                        <div className="space-y-4">
                          {teamObjectives.map(objective => (
                            <div key={objective.id} className="border rounded-md p-4">
                              <div className="flex justify-between mb-1">
                                <div className="font-medium">{objective.title}</div>
                                <div className={`text-sm font-medium ${
                                  objective.status === 'on_track' 
                                    ? 'text-green-500' 
                                    : objective.status === 'at_risk' 
                                      ? 'text-amber-500' 
                                      : 'text-red-500'
                                }`}>
                                  {objective.status === 'on_track' 
                                    ? 'On Track' 
                                    : objective.status === 'at_risk' 
                                      ? 'At Risk' 
                                      : 'Behind'}
                                </div>
                              </div>
                              <div className="flex justify-between mb-2">
                                <div className="text-sm text-muted-foreground truncate max-w-[80%]">
                                  {objective.description}
                                </div>
                                <div className="text-sm font-medium">{objective.progress}%</div>
                              </div>
                              <Progress value={objective.progress} className="h-1.5" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : null;
                })}
                
                {!teams?.some(team => filteredObjectives?.some(obj => obj.teamId === team.id)) && (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    No team data available for the selected timeframe
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>OKR Trends Over Time</CardTitle>
                <CardDescription>
                  Coming soon: Progress trends analysis over time periods.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-10 text-muted-foreground">
                Trend analysis features are in development
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Key Results Completion Rate</CardTitle>
                <CardDescription>
                  Coming soon: Analysis of key result completion rates by timeframe and team.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-10 text-muted-foreground">
                Completion rate analysis is in development
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}