import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  FileSpreadsheet, 
  Download, 
  Presentation, 
  PlayCircle,
  Calendar,
  Filter,
  FileOutput 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Team, Timeframe } from "@/types/custom-types";
import { useToast } from "@/hooks/use-toast";

export default function ExportReports() {
  const [exportTimeframe, setExportTimeframe] = useState<string>("all");
  const [exportTeam, setExportTeam] = useState<string>("all");
  const [exportType, setExportType] = useState<string>("detailed");
  const { toast } = useToast();
  
  // Fetch data needed for filters
  const { data: objectives, isLoading: isLoadingObjectives } = useQuery({
    queryKey: ['/api/objectives'],
  });
  
  const { data: teams, isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });
  
  const { data: timeframes, isLoading: isLoadingTimeframes } = useQuery<Timeframe[]>({
    queryKey: ['/api/timeframes'],
  });
  
  const isLoading = isLoadingObjectives || isLoadingTeams || isLoadingTimeframes;
  
  // Filter objectives by selected timeframe and team
  const filteredObjectives = objectives?.filter(objective => 
    (exportTimeframe === "all" || objective.timeframeId === parseInt(exportTimeframe)) &&
    (exportTeam === "all" || objective.teamId === parseInt(exportTeam))
  ) || [];
  
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
    <DashboardLayout title="OKR Report Export">
      <div className="max-w-6xl mx-auto">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <div>
                Selected filters: {getSelectedTimeframeName()} • {getSelectedTeamName()} • {exportType === "detailed" ? "Detailed Report" : exportType === "summary" ? "Summary Report" : "Metrics Only"}
              </div>
              <div>
                {isLoading ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  <span>{filteredObjectives.length} objectives included</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-4 text-sm">
          <h3 className="font-semibold">Preview</h3>
          <div className="space-y-2">
            <div><strong>Selected filters:</strong></div>
            <div>Time Period: {getSelectedTimeframeName()}</div>
            <div>Department: {getSelectedTeamName()}</div>
            <div>View Type: {exportType === "detailed" ? "Detailed" : exportType === "summary" ? "Summary" : "Metrics Only"}</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}