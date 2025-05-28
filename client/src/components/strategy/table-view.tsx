import React from 'react';
import { useParams } from 'wouter';
import { useTenantContext } from '@/hooks/use-tenant-context';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Helper function to get status color
const getStatusColor = (progress: number): { color: string; label: string } => {
  if (progress >= 70) return { color: 'bg-green-100 text-green-800', label: 'On Track' };
  if (progress >= 40) return { color: 'bg-yellow-100 text-yellow-800', label: 'At Risk' };
  return { color: 'bg-red-100 text-red-800', label: 'Behind' };
};

// Helper function to get user initials
const getUserInitials = (name: string): string => {
  if (!name) return 'UN';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

const TableView: React.FC = () => {
  const params = useParams<{ organisation: string }>();
  const { currentTenant } = useTenantContext();
  
  // Build tenant-specific endpoint for API calls
  const organizationId = params?.organisation || currentTenant?.id;
  
  // Fetch objectives data
  const { data: objectivesData = [], isLoading: objectivesLoading } = useQuery({
    queryKey: ['/api/objectives', organizationId],
    enabled: !!organizationId,
  }) as { data: any[], isLoading: boolean };
  
  // Fetch users data for owner information
  const { data: usersData = [] } = useQuery({
    queryKey: ['/api/users', organizationId],
    enabled: !!organizationId,
  }) as { data: any[] };

  // Fetch teams data
  const { data: teamsData = [] } = useQuery({
    queryKey: ['/api/teams', organizationId],
    enabled: !!organizationId,
  }) as { data: any[] };

  // Fetch strategic directions data
  const { data: strategicDirections = [] } = useQuery({
    queryKey: ['/api/strategic-directions', organizationId],
    enabled: !!organizationId,
  }) as { data: any[] };

  if (objectivesLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (objectivesData.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Table View</h2>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No objectives found. Create your first objective to get started.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Table View</h2>
      
      <div className="space-y-4">
        {objectivesData.map((objective) => {
          const owner = usersData.find(u => u.id === objective.owner_id);
          const team = teamsData.find(t => t.id === objective.team_id);
          const strategicDirection = strategicDirections.find(sd => sd.id === objective.strategic_direction_id);
          const keyResults = objective.keyResults || [];
          
          return (
            <Card key={objective.id}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{objective.title}</CardTitle>
                    {objective.description && (
                      <p className="text-sm text-gray-600 mb-3">{objective.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {strategicDirection && (
                        <Badge variant="secondary" className="text-xs">
                          📈 {strategicDirection.name}
                        </Badge>
                      )}
                      {team && (
                        <Badge variant="outline" className="text-xs">
                          👥 {team.name}
                        </Badge>
                      )}
                      {owner && (
                        <Badge variant="outline" className="text-xs">
                          👤 {owner.full_name || owner.username}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {objective.progress !== undefined && (
                      <div className="text-right">
                        <div className="text-sm font-medium">{Math.round(objective.progress)}%</div>
                        <Badge className={getStatusColor(objective.progress).color}>
                          {getStatusColor(objective.progress).label}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {keyResults.length > 0 && (
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Key Results ({keyResults.length})</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3 font-medium text-gray-600">Key Result</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-600">Owner</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-600">Progress</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {keyResults.map((kr: any) => {
                            const krOwner = usersData.find(u => u.id === kr.assigned_to_id);
                            const progress = kr.progress || 0;
                            const status = getStatusColor(progress);
                            
                            return (
                              <tr key={kr.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-3">
                                  <div>
                                    <div className="font-medium text-gray-900">{kr.title}</div>
                                    {kr.description && (
                                      <div className="text-xs text-gray-500 mt-1">{kr.description}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  {krOwner ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                        {getUserInitials(krOwner.full_name || krOwner.username)}
                                      </div>
                                      <span className="text-sm">{krOwner.full_name || krOwner.username}</span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-sm">Unassigned</span>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <Progress value={progress} className="w-16 h-2" />
                                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <Badge className={status.color}>
                                    {status.label}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              )}
              
              {keyResults.length === 0 && (
                <CardContent>
                  <p className="text-sm text-gray-500 text-center py-4">
                    No key results defined for this objective.
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TableView;