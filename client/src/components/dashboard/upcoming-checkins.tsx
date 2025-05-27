import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface CheckIn {
  id: string;
  content?: string;
  notes?: string;
  objectiveId?: string;
  keyResultId?: string;
  userId: string;
  tenantId: string;
  createdAt: string;
  updatedAt?: string;
}

export default function UpcomingCheckIns() {
  const { currentTenant } = useTenantContext();
  const { user } = useAuth();

  // Fetch check-ins data
  const { data: checkIns, isLoading } = useQuery({
    queryKey: ["/api/check-ins"],
    enabled: !!currentTenant?.id && !!user,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  });

  // Process check-ins to determine upcoming ones
  const upcomingCheckIns = useMemo(() => {
    if (!checkIns || checkIns.length === 0) return [];

    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Get recent check-ins from the last week
    const recentCheckIns = checkIns.filter((checkIn: CheckIn) => {
      const checkInDate = new Date(checkIn.createdAt);
      const daysSinceCheckIn = Math.floor((now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceCheckIn <= 7;
    });

    // Group by user to see who needs to check in
    const userCheckIns = recentCheckIns.reduce((acc: any, checkIn: CheckIn) => {
      if (!acc[checkIn.userId]) {
        acc[checkIn.userId] = [];
      }
      acc[checkIn.userId].push(checkIn);
      return acc;
    }, {});

    return {
      recent: recentCheckIns.slice(0, 3), // Show latest 3 check-ins
      count: recentCheckIns.length,
      usersWithCheckIns: Object.keys(userCheckIns).length
    };
  }, [checkIns]);

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Recent Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Recent Check-ins</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-2 rounded-md">
              <Calendar className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="font-medium">{upcomingCheckIns.count} Check-ins</h3>
              <p className="text-sm text-slate-500">
                {upcomingCheckIns.count > 0 
                  ? `From ${upcomingCheckIns.usersWithCheckIns} team members this week`
                  : 'No check-ins this week'
                }
              </p>
            </div>
          </div>
          <div className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600">
            This Week
          </div>
        </div>

        {/* Show recent check-ins */}
        {upcomingCheckIns.recent.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-xs font-medium text-slate-600 mb-2">Latest Updates:</div>
            {upcomingCheckIns.recent.map((checkIn: CheckIn) => (
              <div key={checkIn.id} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-700">
                    {checkIn.objectiveId ? 'Objective' : 'Key Result'} update
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {getTimeAgo(checkIn.createdAt)}
                  </Badge>
                  <Clock className="h-3 w-3 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}

        {upcomingCheckIns.count === 0 && (
          <div className="mt-4 text-center py-4">
            <Target className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No check-ins recorded this week</p>
            <p className="text-xs text-slate-400 mt-1">Encourage your team to share progress updates</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}