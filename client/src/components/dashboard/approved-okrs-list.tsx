import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Define the types for the data we'll receive
interface KeyResult {
  id: string;
  title: string;
  description?: string;
  current_value?: string;
  target_value?: string;
  start_value?: string;
  progress?: number;
  status?: string;
  objective_id: string;
}

interface Objective {
  id: string;
  title: string;
  description?: string;
  status: string;
  level: string;
  progress: number;
  keyResults: KeyResult[];
  timeframeId?: string;
  teamId?: string;
  ownerId?: string;
}

const ApprovedOkrsList = ({ tenantId }: { tenantId: string }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const { data: approvedOkrs, isLoading, error } = useQuery({
    queryKey: [`/api/${tenantId}/approved-okrs`],
    enabled: !!tenantId && !!user,
    queryFn: async ({ queryKey }) => {
      try {
        const response = await apiRequest('GET', queryKey[0] as string);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch approved OKRs');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching approved OKRs:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'An error occurred while fetching approved OKRs',
          variant: 'destructive'
        });
        return [];
      }
    }
  });
  
  // Helper function to get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'on_track':
      case 'on track':
        return 'bg-green-100 text-green-800';
      case 'at_risk':
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
  
  // Format the status string for display
  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format level for display
  const formatLevel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };
  
  // Get level badge color
  const getLevelBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'company':
        return 'bg-purple-100 text-purple-800';
      case 'department':
        return 'bg-indigo-100 text-indigo-800';
      case 'team':
        return 'bg-cyan-100 text-cyan-800';
      case 'individual':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'on_track':
      case 'on track':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'at_risk':
      case 'at risk':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'behind':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="w-full">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">Error Loading Approved OKRs</CardTitle>
          <CardDescription className="text-red-700">
            {error instanceof Error ? error.message : 'An error occurred while loading approved OKRs'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-2">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!approvedOkrs || approvedOkrs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Approved OKRs</CardTitle>
          <CardDescription>
            There are no approved objectives for this organization yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Approved OKRs</h2>
      {approvedOkrs.map((objective: Objective) => (
        <Card key={objective.id} className="transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{objective.title}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={getLevelBadgeColor(objective.level)}>
                    {formatLevel(objective.level)}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(objective.status)}
                    <Badge className={getStatusBadgeColor(objective.status)}>
                      {formatStatus(objective.status)}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">Progress</div>
                <div className="text-xl font-bold">{objective.progress}%</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {objective.description && (
              <p className="text-gray-600 text-sm mb-4">{objective.description}</p>
            )}
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className={`h-2 rounded-full ${
                  objective.progress >= 70 ? 'bg-green-500' : 
                  objective.progress >= 40 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${objective.progress}%` }}
              ></div>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Key Results ({objective.keyResults?.length || 0})</h4>
              {objective.keyResults?.slice(0, 3).map((kr) => (
                <div key={kr.id} className="pl-4 border-l-2 border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium">{kr.title}</div>
                    <Badge variant="outline">{kr.progress || 0}%</Badge>
                  </div>
                  {kr.description && (
                    <p className="text-xs text-gray-500 mt-1">{kr.description}</p>
                  )}
                </div>
              ))}
              {objective.keyResults?.length > 3 && (
                <div className="text-xs text-gray-500 italic">
                  + {objective.keyResults.length - 3} more key results
                </div>
              )}
            </div>
            
            <Button 
              variant="ghost" 
              className="text-sm mt-4"
              onClick={() => navigate(`/objective-detail/${objective.id}`)}
            >
              View Details
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ApprovedOkrsList;