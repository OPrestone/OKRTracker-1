import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
  BarChart,
  Check,
  CheckCircle2,
  Clock,
  LineChart,
  MessageSquare,
  Target,
  User,
  Users,
  AlertTriangle,
  XCircle,
  Calendar,
  CheckCheck,
} from "lucide-react";

interface Widget {
  id: string;
  type: string;
  title: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
  position: number;
  data?: any;
}

interface DashboardWidgetProps {
  widget: Widget;
  objectives: any[];
  teams: any[];
  checkIns: any[];
}

export function DashboardWidget({
  widget,
  objectives,
  teams,
  checkIns,
}: DashboardWidgetProps) {
  // Helper function to get the color based on progress
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-blue-500";
    if (progress >= 25) return "bg-amber-500";
    return "bg-red-500";
  };

  // Helper function to get the color based on status
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'on track':
        return 'bg-green-100 text-green-800';
      case 'at risk':
        return 'bg-amber-100 text-amber-800';
      case 'behind':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get the status icon
  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'on track':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'at risk':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'behind':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <CheckCheck className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Sort objectives by progress
  const sortedObjectives = [...objectives].sort((a, b) => b.progress - a.progress);
  
  // Get recent check-ins
  const recentCheckIns = [...(checkIns || [])].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }).slice(0, 5);

  // Get upcoming deadlines
  const today = new Date();
  const upcomingDeadlines = objectives
    .filter(obj => obj.endDate && new Date(obj.endDate) > today)
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 5);

  // Calculate overall progress for the progress summary widget
  const overallProgress = objectives.length
    ? Math.round(objectives.reduce((sum, obj) => sum + (obj.progress || 0), 0) / objectives.length)
    : 0;

  // Team performance data
  const teamPerformance = teams.map(team => {
    const teamObjectives = objectives.filter(obj => obj.teamId === team.id);
    const teamProgress = teamObjectives.length
      ? Math.round(teamObjectives.reduce((sum, obj) => sum + (obj.progress || 0), 0) / teamObjectives.length)
      : 0;
    
    return {
      ...team,
      progress: teamProgress,
      objectivesCount: teamObjectives.length,
    };
  });

  // Render different widget types
  switch (widget.type) {
    case 'progress-summary':
      return (
        <div className="space-y-4">
          <div className="flex flex-col items-center">
            <div className="relative h-36 w-36">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3"></circle>
                <circle 
                  className="transition-all duration-500 ease-in-out" 
                  cx="18" 
                  cy="18" 
                  r="15" 
                  fill="none" 
                  stroke={overallProgress >= 75 ? "#10B981" : overallProgress >= 50 ? "#3B82F6" : overallProgress >= 25 ? "#F59E0B" : "#EF4444"} 
                  strokeWidth="3" 
                  strokeDasharray="100" 
                  strokeDashoffset={100 - overallProgress}
                  transform="rotate(-90 18 18)"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold">{overallProgress}%</span>
              </div>
            </div>
            <h3 className="text-lg font-medium mt-2">Overall Progress</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border rounded-md p-3">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-medium">Completed</h4>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {objectives.filter(obj => obj.status?.toLowerCase() === 'completed').length}
                </Badge>
              </div>
              <div className="text-xs text-gray-500">
                {Math.round((objectives.filter(obj => obj.status?.toLowerCase() === 'completed').length / (objectives.length || 1)) * 100)}% of total objectives
              </div>
            </div>
            
            <div className="border rounded-md p-3">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-medium">At Risk</h4>
                <Badge variant="outline" className="bg-amber-100 text-amber-800">
                  {objectives.filter(obj => obj.status?.toLowerCase() === 'at risk').length}
                </Badge>
              </div>
              <div className="text-xs text-gray-500">
                {Math.round((objectives.filter(obj => obj.status?.toLowerCase() === 'at risk').length / (objectives.length || 1)) * 100)}% of total objectives
              </div>
            </div>
          </div>
        </div>
      );
      
    case 'my-objectives':
      return (
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {sortedObjectives.slice(0, 5).map(obj => (
              <div key={obj.id} className="border rounded-md p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium truncate" title={obj.title}>
                      {obj.title}
                    </h4>
                    <div className="flex items-center mt-1 space-x-2">
                      <Badge variant="outline" className={getStatusColor(obj.status)}>
                        {obj.status}
                      </Badge>
                      
                      {obj.timeframe && (
                        <span className="text-xs text-gray-500">
                          {obj.timeframe}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-medium ml-2">{obj.progress}%</div>
                </div>
                
                <div className="mt-2">
                  <Progress 
                    value={obj.progress} 
                    className="h-1.5"
                    indicatorClassName={getProgressColor(obj.progress)}
                  />
                </div>
              </div>
            ))}
            
            {sortedObjectives.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center p-4 h-32">
                <Target className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No objectives found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      );
      
    case 'recent-check-ins':
      return (
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {recentCheckIns.map(checkIn => {
              const checkInObj = objectives.find(obj => obj.id === checkIn.objectiveId);
              return (
                <div key={checkIn.id} className="border rounded-md p-3">
                  <div className="flex items-start mb-2">
                    <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium">
                        {checkInObj?.title || "Unknown Objective"}
                      </p>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-xs text-gray-500">
                          {format(new Date(checkIn.createdAt), "MMM d, yyyy")}
                        </span>
                        {checkIn.progress !== null && checkIn.progress !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            {checkIn.progress}% complete
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {checkIn.notes && (
                    <p className="text-xs text-gray-600 line-clamp-2 pl-6">
                      {checkIn.notes}
                    </p>
                  )}
                </div>
              );
            })}
            
            {recentCheckIns.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center p-4 h-32">
                <MessageSquare className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No recent check-ins</p>
              </div>
            )}
          </div>
        </ScrollArea>
      );
      
    case 'team-performance':
      return (
        <div className="h-[300px] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-3">Team Progress</h3>
              <div className="space-y-3">
                {teamPerformance.slice(0, 5).map(team => (
                  <div key={team.id}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <Users className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
                        <span className="text-sm">{team.name}</span>
                      </div>
                      <span className="text-xs font-medium">{team.progress}%</span>
                    </div>
                    <Progress 
                      value={team.progress} 
                      className="h-1.5"
                      indicatorClassName={getProgressColor(team.progress)}
                    />
                  </div>
                ))}
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-3">Objectives by Status</h3>
              <div className="flex flex-col h-full justify-center">
                <div className="grid grid-cols-2 gap-2">
                  {['completed', 'on track', 'at risk', 'behind'].map(status => {
                    const count = objectives.filter(obj => obj.status?.toLowerCase() === status).length;
                    const percentage = Math.round((count / (objectives.length || 1)) * 100);
                    
                    return (
                      <div key={status} className="border rounded-md p-2">
                        <div className="flex items-center mb-1">
                          {getStatusIcon(status)}
                          <span className="text-xs font-medium ml-1.5 capitalize">{status}</span>
                        </div>
                        <div className="flex items-end justify-between">
                          <span className="text-lg font-bold">{count}</span>
                          <span className="text-xs text-gray-500">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        </div>
      );
      
    case 'upcoming-deadlines':
      return (
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {upcomingDeadlines.map(deadline => {
              const daysRemaining = Math.ceil((new Date(deadline.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={deadline.id} className="border rounded-md p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium line-clamp-1" title={deadline.title}>
                        {deadline.title}
                      </p>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
                        <span className="text-xs text-gray-500">
                          Due {format(new Date(deadline.endDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    <Badge variant={daysRemaining <= 7 ? "destructive" : "outline"}>
                      {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                    </Badge>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span>{deadline.progress}%</span>
                    </div>
                    <Progress 
                      value={deadline.progress} 
                      className="h-1.5"
                      indicatorClassName={getProgressColor(deadline.progress)}
                    />
                  </div>
                </div>
              );
            })}
            
            {upcomingDeadlines.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center p-4 h-32">
                <Calendar className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No upcoming deadlines</p>
              </div>
            )}
          </div>
        </ScrollArea>
      );
      
    case 'recent-activity':
      // Combine check-ins and any other activity for a feed
      const recentActivity = [
        ...recentCheckIns.map(checkIn => ({
          id: `checkin-${checkIn.id}`,
          type: 'check-in',
          title: objectives.find(obj => obj.id === checkIn.objectiveId)?.title || "Unknown Objective",
          timestamp: new Date(checkIn.createdAt),
          data: checkIn
        }))
      ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 6);
      
      return (
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {recentActivity.map(activity => (
              <div key={activity.id} className="border rounded-md p-3">
                <div className="flex items-center">
                  {activity.type === 'check-in' && (
                    <MessageSquare className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                  )}
                  <div>
                    <div className="text-sm font-medium line-clamp-1">
                      {activity.type === 'check-in' ? 'Check-in on' : ''} {activity.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {format(activity.timestamp, "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {recentActivity.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center p-4 h-32">
                <Clock className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </ScrollArea>
      );
      
    case 'objective-completion':
      const completionRate = Math.round((objectives.filter(obj => obj.status?.toLowerCase() === 'completed').length / (objectives.length || 1)) * 100);
      
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="relative h-32 w-32">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3"></circle>
              <circle 
                className="transition-all duration-500 ease-in-out" 
                cx="18" 
                cy="18" 
                r="15" 
                fill="none" 
                stroke={completionRate >= 75 ? "#10B981" : completionRate >= 50 ? "#3B82F6" : completionRate >= 25 ? "#F59E0B" : "#EF4444"} 
                strokeWidth="3" 
                strokeDasharray="100" 
                strokeDashoffset={100 - completionRate}
                transform="rotate(-90 18 18)"
              ></circle>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{completionRate}%</span>
            </div>
          </div>
          <h3 className="text-base font-medium mt-2">Completion Rate</h3>
          <p className="text-xs text-gray-500 mt-1">
            {objectives.filter(obj => obj.status?.toLowerCase() === 'completed').length} of {objectives.length} objectives completed
          </p>
        </div>
      );
      
    case 'team-alignment':
      // This would ideally use the alignment data from the API
      // For now, we'll show a simplified version
      return (
        <div className="flex flex-col items-center p-4">
          <BarChart className="h-24 w-24 text-blue-500 mb-2" />
          <h3 className="text-base font-medium">Team Alignment</h3>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Team alignment data visualization would go here, showing how team objectives align with company objectives.
          </p>
        </div>
      );
      
    case 'key-metrics':
      // This would use real metrics from the API
      return (
        <div className="flex flex-col items-center p-4">
          <LineChart className="h-24 w-24 text-green-500 mb-2" />
          <h3 className="text-base font-medium">Key Metrics Overview</h3>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Key metrics visualization would go here, showing important OKR metrics over time.
          </p>
        </div>
      );
    
    default:
      return (
        <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-md">
          <p className="text-muted-foreground text-center">
            {widget.title} Widget<br />
            <span className="text-xs">Type: {widget.type}</span>
          </p>
        </div>
      );
  }
}