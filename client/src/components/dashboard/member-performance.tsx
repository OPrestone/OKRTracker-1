import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getQueryFn } from '@/lib/queryClient';
import { useTenantContext } from '@/hooks/use-tenant-context';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MemberPerformanceProps {
  teamId: string | undefined;
  userId: string;
}

const MemberPerformance = ({ teamId, userId }: MemberPerformanceProps) => {
  const { tenantId } = useTenantContext();
  
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/teams/${teamId || ''}/members/${userId}/performance`, tenantId],
    queryFn: getQueryFn(),
    enabled: !!teamId && !!userId && !!tenantId,
  });

  if (isLoading) {
    return (
      <Card className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="min-h-[400px]">
        <CardHeader>
          <CardTitle>Member Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load member performance data. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="min-h-[400px]">
        <CardHeader>
          <CardTitle>Member Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Data</AlertTitle>
            <AlertDescription>
              No performance data available for this team member.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { user, metrics } = data;
  
  // Prepare chart data for objectives status
  const objectivesStatusData = [
    { name: 'Completed', value: metrics.completedObjectives, color: '#16a34a' },
    { name: 'On Track', value: metrics.onTrackObjectives, color: '#2563eb' },
    { name: 'At Risk', value: metrics.atRiskObjectives, color: '#eab308' },
    { name: 'Behind', value: metrics.behindObjectives, color: '#dc2626' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{user.name}'s Performance Overview</CardTitle>
          <CardDescription>
            Performance metrics for objectives and key results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Overall Progress</div>
                <div className="text-sm text-muted-foreground">{metrics.overallProgress}%</div>
              </div>
              <Progress value={metrics.overallProgress} className="h-2" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">Objectives Assigned</div>
                <div className="text-2xl font-bold">{metrics.totalAssignedObjectives}</div>
                <div className="text-sm text-muted-foreground">
                  {metrics.completedObjectives} completed
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium">Key Results Assigned</div>
                <div className="text-2xl font-bold">{metrics.totalAssignedKeyResults}</div>
                <div className="text-sm text-muted-foreground">
                  {metrics.completedKeyResults} completed
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {objectivesStatusData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Objectives by Status</CardTitle>
            <CardDescription>
              Distribution of objectives by their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={objectivesStatusData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" name="Count">
                    {objectivesStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {data.objectives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Objectives</CardTitle>
            <CardDescription>
              Objectives assigned to this team member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.objectives.map((objective: any) => (
                <div key={objective.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{objective.title}</div>
                    <div className="flex items-center">
                      {objective.status === 'on-track' && (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      )}
                      {objective.status === 'at-risk' && (
                        <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                      )}
                      {objective.status === 'behind' && (
                        <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-xs font-medium ${
                        objective.status === 'on-track' ? 'text-green-500' : 
                        objective.status === 'at-risk' ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {objective.status.charAt(0).toUpperCase() + objective.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {objective.description}
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Progress</span>
                      <span>{objective.progress}%</span>
                    </div>
                    <Progress value={objective.progress} className="h-1 mt-1" />
                  </div>
                  {objective.keyResults && objective.keyResults.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs font-medium mb-2">Key Results:</div>
                      <div className="space-y-2">
                        {objective.keyResults.map((kr: any) => (
                          <div key={kr.id} className="text-xs">
                            • {kr.title} - {kr.progress}% complete
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MemberPerformance;