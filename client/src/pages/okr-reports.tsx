import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  FileSpreadsheet, 
  Download, 
  Presentation, 
  PlayCircle,
  Calendar,
  Filter,
  FileOutput 
} from "lucide-react";
import { ObjectiveWithDetails, Team, Timeframe, User } from "@/types/custom-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function OKRReports() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [expandedObjectives, setExpandedObjectives] = useState<Record<number, boolean>>({});
  const [exportTimeframe, setExportTimeframe] = useState<string>("all");
  const [exportTeam, setExportTeam] = useState<string>("all");
  const [exportType, setExportType] = useState<string>("detailed");
  const { toast } = useToast();
  
  // Fetch all data needed for reports
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
  
  // Get key results for each objective
  const { data: keyResults, isLoading: isLoadingKeyResults } = useQuery({
    queryKey: ['/api/key-results'],
  });
  
  // Filter objectives by selected timeframe and team
  const filteredObjectives = objectives?.filter(objective => 
    (selectedTimeframe === "all" || objective.timeframeId === parseInt(selectedTimeframe)) &&
    (selectedTeam === "all" || objective.teamId === parseInt(selectedTeam))
  ) || [];
  
  // Enrich objectives with key results
  const enrichedObjectives = filteredObjectives.map(objective => {
    const objectiveKeyResults = keyResults?.filter(kr => kr.objectiveId === objective.id) || [];
    const owner = users?.find(user => user.id === objective.ownerId);
    const team = teams?.find(team => team.id === objective.teamId);
    return {
      ...objective,
      keyResults: objectiveKeyResults,
      owner,
      team
    };
  });
  
  // Group objectives by level
  const companyObjectives = enrichedObjectives.filter(obj => obj.level === 'company');
  const departmentObjectives = enrichedObjectives.filter(obj => obj.level === 'department');
  const teamObjectives = enrichedObjectives.filter(obj => obj.level === 'team');
  const individualObjectives = enrichedObjectives.filter(obj => obj.level === 'individual');
  
  const toggleObjective = (id: number) => {
    setExpandedObjectives(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const isLoading = isLoadingObjectives || isLoadingTeams || isLoadingTimeframes || isLoadingUsers || isLoadingKeyResults;
  
  // Get status class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'bg-green-100 text-green-800';
      case 'at_risk':
        return 'bg-amber-100 text-amber-800';
      case 'behind':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format status text
  const formatStatus = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'On Track';
      case 'at_risk':
        return 'At Risk';
      case 'behind':
        return 'Behind';
      default:
        return status;
    }
  };
  
  // Export function handlers
  const handleExcelExport = () => {
    toast({
      title: "Export Started",
      description: "Excel export has been started and will download shortly.",
    });
    
    // In a real implementation, this would call an API endpoint to generate the Excel file
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Your Excel report has been downloaded.",
      });
    }, 1500);
  };
  
  const handlePowerPointExport = (presentMode = false) => {
    if (presentMode) {
      toast({
        title: "Presentation Mode",
        description: "Starting presentation mode...",
      });
    } else {
      toast({
        title: "Export Started",
        description: "PowerPoint export has been started and will download shortly.",
      });
      
      // In a real implementation, this would call an API endpoint to generate the PowerPoint file
      setTimeout(() => {
        toast({
          title: "Export Complete",
          description: "Your PowerPoint report has been downloaded.",
        });
      }, 1500);
    }
  };
  
  // Get selected timeframe and team names for display
  const getSelectedTimeframeName = () => {
    if (exportTimeframe === "all") return "All Timeframes";
    const timeframe = timeframes?.find(t => t.id.toString() === exportTimeframe);
    return timeframe ? timeframe.name : "Selected Timeframe";
  };
  
  const getSelectedTeamName = () => {
    if (exportTeam === "all") return "All Teams";
    const team = teams?.find(t => t.id.toString() === exportTeam);
    return team ? team.name : "Selected Team";
  };
  
  return (
    <DashboardLayout title="OKR Performance Reports">
      <div className="space-y-6">
        {/* OKR Report Export Section */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">OKR Report Export</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="export-timeframe">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={16} />
                  <span>Time Period</span>
                </div>
              </Label>
              <Select value={exportTimeframe} onValueChange={setExportTimeframe}>
                <SelectTrigger id="export-timeframe">
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
            
            <div>
              <Label htmlFor="export-team">
                <div className="flex items-center gap-2 mb-1">
                  <FileOutput size={16} />
                  <span>Team</span>
                </div>
              </Label>
              <Select value={exportTeam} onValueChange={setExportTeam}>
                <SelectTrigger id="export-team">
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
            
            <div>
              <Label htmlFor="export-type">
                <div className="flex items-center gap-2 mb-1">
                  <Filter size={16} />
                  <span>Report Type</span>
                </div>
              </Label>
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger id="export-type">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="metrics">Metrics Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Excel Export */}
            <div className="border rounded-lg p-5 bg-white">
              <div className="flex items-start gap-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium">Excel Export</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Export your OKR data to Excel format for detailed analysis and reporting.
                  </p>
                  
                  <div className="text-sm text-slate-700 space-y-1 mb-4">
                    <p>Includes:</p>
                    <ul className="ml-5 list-disc space-y-1">
                      <li>Objective and Key Results breakdown</li>
                      <li>Progress tracking metrics</li>
                      <li>Department-wise analysis</li>
                      <li>Historical data comparison</li>
                      <li>Present Team Dashboard</li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleExcelExport} 
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* PowerPoint Export */}
            <div className="border rounded-lg p-5 bg-white">
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Presentation className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium">PowerPoint Export</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Generate presentation-ready slides showcasing your OKR progress and achievements.
                  </p>
                  
                  <div className="text-sm text-slate-700 space-y-1 mb-4">
                    <p>Includes:</p>
                    <ul className="ml-5 list-disc space-y-1">
                      <li>Executive summary</li>
                      <li>Visual progress indicators</li>
                      <li>Key achievements highlights</li>
                      <li>Next quarter planning</li>
                      <li>Present Team Dashboard</li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      onClick={() => handlePowerPointExport(true)} 
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Present
                    </Button>
                    <Button 
                      onClick={() => handlePowerPointExport(false)} 
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-3 border-t text-sm text-slate-500">
            <div>
              Selected filters: {getSelectedTimeframeName()} • {getSelectedTeamName()} • {exportType === "detailed" ? "Detailed Report" : exportType === "summary" ? "Summary Report" : "Metrics Only"}
            </div>
            <div>
              {isLoading ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <span>{enrichedObjectives.length} objectives included</span>
              )}
            </div>
          </div>
        </div>
      
        {/* Regular reports section */}
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">All Objectives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredObjectives.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredObjectives.length > 0 
                  ? Math.round(filteredObjectives.reduce((sum, obj) => sum + obj.progress, 0) / filteredObjectives.length)
                  : 0}%
              </div>
              <Progress 
                value={filteredObjectives.length > 0 
                  ? filteredObjectives.reduce((sum, obj) => sum + obj.progress, 0) / filteredObjectives.length
                  : 0
                } 
                className="h-2 mt-2" 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">On Track</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {filteredObjectives.filter(obj => obj.status === 'on_track').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">At Risk / Behind</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">
                {filteredObjectives.filter(obj => obj.status === 'at_risk' || obj.status === 'behind').length}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="by-level" className="space-y-6">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="by-level">View by Level</TabsTrigger>
            <TabsTrigger value="by-status">View by Status</TabsTrigger>
          </TabsList>
          
          <TabsContent value="by-level" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {companyObjectives.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Company Objectives</CardTitle>
                      <CardDescription>Strategic objectives at the company level</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {companyObjectives.map(objective => (
                        <div key={objective.id} className="border rounded-lg overflow-hidden">
                          <div 
                            className="flex justify-between items-center p-4 bg-slate-50 cursor-pointer"
                            onClick={() => toggleObjective(objective.id)}
                          >
                            <div>
                              <h3 className="font-medium">{objective.title}</h3>
                              <div className="text-sm text-muted-foreground mt-1">
                                {objective.team?.name || 'No Team'} • 
                                Owner: {objective.owner?.firstName} {objective.owner?.lastName}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={getStatusClass(objective.status)}>
                                {formatStatus(objective.status)}
                              </Badge>
                              <div className="text-sm font-semibold">{objective.progress}%</div>
                              <Button variant="ghost" size="sm">
                                {expandedObjectives[objective.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </Button>
                            </div>
                          </div>
                          
                          {expandedObjectives[objective.id] && (
                            <div className="p-4 border-t bg-white">
                              <div className="text-sm mb-3">{objective.description}</div>
                              <Progress value={objective.progress} className="h-2 mb-4" />
                              
                              {objective.keyResults && objective.keyResults.length > 0 ? (
                                <div className="space-y-3">
                                  <h4 className="text-sm font-semibold">Key Results</h4>
                                  {objective.keyResults.map(keyResult => (
                                    <div key={keyResult.id} className="bg-slate-50 rounded p-3">
                                      <div className="flex justify-between mb-1">
                                        <div className="font-medium text-sm">{keyResult.title}</div>
                                        <div className="text-sm font-medium">{keyResult.progress}%</div>
                                      </div>
                                      <Progress value={keyResult.progress} className="h-1.5" />
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">No key results defined</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                
                {departmentObjectives.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Department Objectives</CardTitle>
                      <CardDescription>Objectives at the department level</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {departmentObjectives.map(objective => (
                        <div key={objective.id} className="border rounded-lg overflow-hidden">
                          <div 
                            className="flex justify-between items-center p-4 bg-slate-50 cursor-pointer"
                            onClick={() => toggleObjective(objective.id)}
                          >
                            <div>
                              <h3 className="font-medium">{objective.title}</h3>
                              <div className="text-sm text-muted-foreground mt-1">
                                {objective.team?.name || 'No Team'} • 
                                Owner: {objective.owner?.firstName} {objective.owner?.lastName}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={getStatusClass(objective.status)}>
                                {formatStatus(objective.status)}
                              </Badge>
                              <div className="text-sm font-semibold">{objective.progress}%</div>
                              <Button variant="ghost" size="sm">
                                {expandedObjectives[objective.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </Button>
                            </div>
                          </div>
                          
                          {expandedObjectives[objective.id] && (
                            <div className="p-4 border-t bg-white">
                              <div className="text-sm mb-3">{objective.description}</div>
                              <Progress value={objective.progress} className="h-2 mb-4" />
                              
                              {objective.keyResults && objective.keyResults.length > 0 ? (
                                <div className="space-y-3">
                                  <h4 className="text-sm font-semibold">Key Results</h4>
                                  {objective.keyResults.map(keyResult => (
                                    <div key={keyResult.id} className="bg-slate-50 rounded p-3">
                                      <div className="flex justify-between mb-1">
                                        <div className="font-medium text-sm">{keyResult.title}</div>
                                        <div className="text-sm font-medium">{keyResult.progress}%</div>
                                      </div>
                                      <Progress value={keyResult.progress} className="h-1.5" />
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">No key results defined</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                
                {teamObjectives.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Objectives</CardTitle>
                      <CardDescription>Objectives at the team level</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Similar structure as above */}
                      {teamObjectives.map(objective => (
                        <div key={objective.id} className="border rounded-lg overflow-hidden">
                          <div 
                            className="flex justify-between items-center p-4 bg-slate-50 cursor-pointer"
                            onClick={() => toggleObjective(objective.id)}
                          >
                            <div>
                              <h3 className="font-medium">{objective.title}</h3>
                              <div className="text-sm text-muted-foreground mt-1">
                                {objective.team?.name || 'No Team'} • 
                                Owner: {objective.owner?.firstName} {objective.owner?.lastName}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={getStatusClass(objective.status)}>
                                {formatStatus(objective.status)}
                              </Badge>
                              <div className="text-sm font-semibold">{objective.progress}%</div>
                              <Button variant="ghost" size="sm">
                                {expandedObjectives[objective.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </Button>
                            </div>
                          </div>
                          
                          {expandedObjectives[objective.id] && (
                            <div className="p-4 border-t bg-white">
                              <div className="text-sm mb-3">{objective.description}</div>
                              <Progress value={objective.progress} className="h-2 mb-4" />
                              
                              {objective.keyResults && objective.keyResults.length > 0 ? (
                                <div className="space-y-3">
                                  <h4 className="text-sm font-semibold">Key Results</h4>
                                  {objective.keyResults.map(keyResult => (
                                    <div key={keyResult.id} className="bg-slate-50 rounded p-3">
                                      <div className="flex justify-between mb-1">
                                        <div className="font-medium text-sm">{keyResult.title}</div>
                                        <div className="text-sm font-medium">{keyResult.progress}%</div>
                                      </div>
                                      <Progress value={keyResult.progress} className="h-1.5" />
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">No key results defined</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                
                {individualObjectives.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Individual Objectives</CardTitle>
                      <CardDescription>Objectives at the individual level</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Similar structure as above */}
                      {individualObjectives.map(objective => (
                        <div key={objective.id} className="border rounded-lg overflow-hidden">
                          <div 
                            className="flex justify-between items-center p-4 bg-slate-50 cursor-pointer"
                            onClick={() => toggleObjective(objective.id)}
                          >
                            <div>
                              <h3 className="font-medium">{objective.title}</h3>
                              <div className="text-sm text-muted-foreground mt-1">
                                {objective.team?.name || 'No Team'} • 
                                Owner: {objective.owner?.firstName} {objective.owner?.lastName}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={getStatusClass(objective.status)}>
                                {formatStatus(objective.status)}
                              </Badge>
                              <div className="text-sm font-semibold">{objective.progress}%</div>
                              <Button variant="ghost" size="sm">
                                {expandedObjectives[objective.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </Button>
                            </div>
                          </div>
                          
                          {expandedObjectives[objective.id] && (
                            <div className="p-4 border-t bg-white">
                              <div className="text-sm mb-3">{objective.description}</div>
                              <Progress value={objective.progress} className="h-2 mb-4" />
                              
                              {objective.keyResults && objective.keyResults.length > 0 ? (
                                <div className="space-y-3">
                                  <h4 className="text-sm font-semibold">Key Results</h4>
                                  {objective.keyResults.map(keyResult => (
                                    <div key={keyResult.id} className="bg-slate-50 rounded p-3">
                                      <div className="flex justify-between mb-1">
                                        <div className="font-medium text-sm">{keyResult.title}</div>
                                        <div className="text-sm font-medium">{keyResult.progress}%</div>
                                      </div>
                                      <Progress value={keyResult.progress} className="h-1.5" />
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">No key results defined</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                
                {filteredObjectives.length === 0 && (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    No objectives found for the selected filters
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="by-status" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {filteredObjectives.filter(obj => obj.status === 'on_track').length > 0 && (
                  <Card>
                    <CardHeader className="bg-green-50">
                      <CardTitle>On Track</CardTitle>
                      <CardDescription>Objectives that are progressing as expected</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      {filteredObjectives
                        .filter(obj => obj.status === 'on_track')
                        .map(objective => (
                          <div key={objective.id} className="border rounded-lg overflow-hidden">
                            <div 
                              className="flex justify-between items-center p-4 bg-slate-50 cursor-pointer"
                              onClick={() => toggleObjective(objective.id)}
                            >
                              <div>
                                <h3 className="font-medium">{objective.title}</h3>
                                <div className="text-sm text-muted-foreground mt-1">
                                  Level: {objective.level.charAt(0).toUpperCase() + objective.level.slice(1)} • 
                                  {objective.team?.name ? ` Team: ${objective.team.name} • ` : ' '}
                                  Owner: {objective.owner?.firstName} {objective.owner?.lastName}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-sm font-semibold text-green-600">{objective.progress}%</div>
                                <Button variant="ghost" size="sm">
                                  {expandedObjectives[objective.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </Button>
                              </div>
                            </div>
                            
                            {expandedObjectives[objective.id] && (
                              <div className="p-4 border-t bg-white">
                                <div className="text-sm mb-3">{objective.description}</div>
                                <Progress value={objective.progress} className="h-2 mb-4" />
                                
                                {objective.keyResults && objective.keyResults.length > 0 ? (
                                  <div className="space-y-3">
                                    <h4 className="text-sm font-semibold">Key Results</h4>
                                    {objective.keyResults.map(keyResult => (
                                      <div key={keyResult.id} className="bg-slate-50 rounded p-3">
                                        <div className="flex justify-between mb-1">
                                          <div className="font-medium text-sm">{keyResult.title}</div>
                                          <div className="text-sm font-medium">{keyResult.progress}%</div>
                                        </div>
                                        <Progress value={keyResult.progress} className="h-1.5" />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-sm text-muted-foreground">No key results defined</div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                )}
                
                {filteredObjectives.filter(obj => obj.status === 'at_risk').length > 0 && (
                  <Card>
                    <CardHeader className="bg-amber-50">
                      <CardTitle>At Risk</CardTitle>
                      <CardDescription>Objectives that may not meet their targets</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      {/* Similar structure as above but for at_risk objectives */}
                      {filteredObjectives
                        .filter(obj => obj.status === 'at_risk')
                        .map(objective => (
                          <div key={objective.id} className="border rounded-lg overflow-hidden">
                            <div 
                              className="flex justify-between items-center p-4 bg-slate-50 cursor-pointer"
                              onClick={() => toggleObjective(objective.id)}
                            >
                              <div>
                                <h3 className="font-medium">{objective.title}</h3>
                                <div className="text-sm text-muted-foreground mt-1">
                                  Level: {objective.level.charAt(0).toUpperCase() + objective.level.slice(1)} • 
                                  {objective.team?.name ? ` Team: ${objective.team.name} • ` : ' '}
                                  Owner: {objective.owner?.firstName} {objective.owner?.lastName}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-sm font-semibold text-amber-600">{objective.progress}%</div>
                                <Button variant="ghost" size="sm">
                                  {expandedObjectives[objective.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </Button>
                              </div>
                            </div>
                            
                            {expandedObjectives[objective.id] && (
                              <div className="p-4 border-t bg-white">
                                <div className="text-sm mb-3">{objective.description}</div>
                                <Progress value={objective.progress} className="h-2 mb-4" />
                                
                                {objective.keyResults && objective.keyResults.length > 0 ? (
                                  <div className="space-y-3">
                                    <h4 className="text-sm font-semibold">Key Results</h4>
                                    {objective.keyResults.map(keyResult => (
                                      <div key={keyResult.id} className="bg-slate-50 rounded p-3">
                                        <div className="flex justify-between mb-1">
                                          <div className="font-medium text-sm">{keyResult.title}</div>
                                          <div className="text-sm font-medium">{keyResult.progress}%</div>
                                        </div>
                                        <Progress value={keyResult.progress} className="h-1.5" />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-sm text-muted-foreground">No key results defined</div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                )}
                
                {filteredObjectives.filter(obj => obj.status === 'behind').length > 0 && (
                  <Card>
                    <CardHeader className="bg-red-50">
                      <CardTitle>Behind</CardTitle>
                      <CardDescription>Objectives that are significantly behind schedule</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      {/* Similar structure as above but for behind objectives */}
                      {filteredObjectives
                        .filter(obj => obj.status === 'behind')
                        .map(objective => (
                          <div key={objective.id} className="border rounded-lg overflow-hidden">
                            <div 
                              className="flex justify-between items-center p-4 bg-slate-50 cursor-pointer"
                              onClick={() => toggleObjective(objective.id)}
                            >
                              <div>
                                <h3 className="font-medium">{objective.title}</h3>
                                <div className="text-sm text-muted-foreground mt-1">
                                  Level: {objective.level.charAt(0).toUpperCase() + objective.level.slice(1)} • 
                                  {objective.team?.name ? ` Team: ${objective.team.name} • ` : ' '}
                                  Owner: {objective.owner?.firstName} {objective.owner?.lastName}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-sm font-semibold text-red-600">{objective.progress}%</div>
                                <Button variant="ghost" size="sm">
                                  {expandedObjectives[objective.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </Button>
                              </div>
                            </div>
                            
                            {expandedObjectives[objective.id] && (
                              <div className="p-4 border-t bg-white">
                                <div className="text-sm mb-3">{objective.description}</div>
                                <Progress value={objective.progress} className="h-2 mb-4" />
                                
                                {objective.keyResults && objective.keyResults.length > 0 ? (
                                  <div className="space-y-3">
                                    <h4 className="text-sm font-semibold">Key Results</h4>
                                    {objective.keyResults.map(keyResult => (
                                      <div key={keyResult.id} className="bg-slate-50 rounded p-3">
                                        <div className="flex justify-between mb-1">
                                          <div className="font-medium text-sm">{keyResult.title}</div>
                                          <div className="text-sm font-medium">{keyResult.progress}%</div>
                                        </div>
                                        <Progress value={keyResult.progress} className="h-1.5" />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-sm text-muted-foreground">No key results defined</div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                )}
                
                {filteredObjectives.length === 0 && (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    No objectives found for the selected filters
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}