import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid, AreaChart, Area
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useParams } from 'wouter';
import { useTenantContext } from '@/hooks/use-tenant-context';
import { useQuery } from '@tanstack/react-query';

// Function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'on-track':
      return '#5bb498';
    case 'at-risk':
      return '#f0c268';
    case 'off-track':
    case 'behind':
      return '#e05d5d';
    case 'pending':
    default:
      return '#9ca3af';
  }
};

// Helper function to determine status based on progress
const getStatusFromProgress = (progress: number): 'on-track' | 'at-risk' | 'off-track' => {
  if (progress >= 70) return 'on-track';
  if (progress >= 40) return 'at-risk';
  return 'off-track';
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

// Helper function to generate user color
const getUserColor = (userId: string): string => {
  const colors = ['#4f46e5', '#22c55e', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444'];
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const KeyResultSummary: React.FC = () => {
  const params = useParams<{ organisation: string }>();
  const { currentTenant } = useTenantContext();
  
  // Build tenant-specific endpoint for API calls
  const organizationId = params?.organisation || currentTenant?.id;
  
  // Fetch key results data
  const { data: keyResultsData = [] } = useQuery({
    queryKey: ['/api/key-results', organizationId],
    enabled: !!organizationId,
  }) as { data: any[] };
  
  // Fetch objectives data
  const { data: objectivesData = [] } = useQuery({
    queryKey: ['/api/objectives', organizationId],
    enabled: !!organizationId,
  }) as { data: any[] };

  // Fetch users data for owner information
  const { data: usersData = [] } = useQuery({
    queryKey: ['/api/users', organizationId],
    enabled: !!organizationId,
  }) as { data: any[] };

  // Calculate real data from the API responses
  const calculatedData = useMemo(() => {
    if (keyResultsData.length === 0) {
      return {
        keyResultsDistribution: [],
        confidenceData: [],
        progressOverTime: [],
        confidenceTrends: [],
        topKeyResults: [],
        bottomKeyResults: [],
        overallProgress: 0,
        netConfidenceScore: 0
      };
    }

    // Create progress distribution
    const distribution = Array.from({ length: 10 }, (_, i) => ({
      range: `${i * 10}-${(i + 1) * 10}%`,
      count: 0
    }));

    // Count status types
    const statusCounts = {
      'on-track': 0,
      'at-risk': 0,
      'off-track': 0,
      'pending': 0
    };

    let totalProgress = 0;

    keyResultsData.forEach(kr => {
      const progress = kr.progress || 0;
      totalProgress += progress;
      
      // Update distribution
      const bucketIndex = Math.min(Math.floor(progress / 10), 9);
      distribution[bucketIndex].count++;

      // Update status counts
      const status = getStatusFromProgress(progress);
      statusCounts[status]++;
    });

    const averageProgress = keyResultsData.length > 0 ? totalProgress / keyResultsData.length : 0;

    // Create confidence data
    const confidenceData = [
      { status: 'On track', count: statusCounts['on-track'], color: '#5bb498' },
      { status: 'At risk', count: statusCounts['at-risk'], color: '#f0c268' },
      { status: 'Off track', count: statusCounts['off-track'], color: '#e05d5d' },
      { status: 'Pending', count: statusCounts['pending'], color: '#9ca3af' },
    ];

    // Calculate net confidence score
    const totalItems = keyResultsData.length;
    const ncs = totalItems > 0 ? Math.round(
      ((statusCounts['on-track'] * 100) + (statusCounts['at-risk'] * 50) + (statusCounts['off-track'] * 0)) / totalItems
    ) : 0;

    // Get top and bottom performing key results
    const sortedKeyResults = [...keyResultsData]
      .map(kr => {
        const user = usersData.find(u => u.id === kr.assigned_to_id);
        return {
          ...kr,
          status: getStatusFromProgress(kr.progress || 0),
          owner: {
            initials: user ? getUserInitials(user.full_name || user.username) : 'UN',
            color: getUserColor(kr.assigned_to_id || 'default')
          }
        };
      })
      .sort((a, b) => (b.progress || 0) - (a.progress || 0));

    const topKeyResults = sortedKeyResults.slice(0, 4);
    const bottomKeyResults = sortedKeyResults.slice(-3).reverse();

    // Mock time series data (would need historical tracking in real implementation)
    const progressOverTime = [
      { date: 'Week 1', keyResults: Math.max(0, averageProgress - 20), tasks: Math.max(0, averageProgress - 25) },
      { date: 'Week 2', keyResults: Math.max(0, averageProgress - 15), tasks: Math.max(0, averageProgress - 20) },
      { date: 'Week 3', keyResults: Math.max(0, averageProgress - 10), tasks: Math.max(0, averageProgress - 15) },
      { date: 'Week 4', keyResults: Math.max(0, averageProgress - 5), tasks: Math.max(0, averageProgress - 10) },
      { date: 'Current', keyResults: averageProgress, tasks: Math.max(0, averageProgress - 5) },
    ];

    const confidenceTrends = [
      { date: 'Week 1', onTrack: Math.max(0, statusCounts['on-track'] - 5), atRisk: statusCounts['at-risk'] + 3, offTrack: statusCounts['off-track'] + 2 },
      { date: 'Week 2', onTrack: Math.max(0, statusCounts['on-track'] - 3), atRisk: statusCounts['at-risk'] + 2, offTrack: statusCounts['off-track'] + 1 },
      { date: 'Week 3', onTrack: Math.max(0, statusCounts['on-track'] - 1), atRisk: statusCounts['at-risk'] + 1, offTrack: statusCounts['off-track'] },
      { date: 'Current', onTrack: statusCounts['on-track'], atRisk: statusCounts['at-risk'], offTrack: statusCounts['off-track'] },
    ];

    return {
      keyResultsDistribution: distribution,
      confidenceData,
      progressOverTime,
      confidenceTrends,
      topKeyResults,
      bottomKeyResults,
      overallProgress: Math.round(averageProgress),
      netConfidenceScore: ncs
    };
  }, [keyResultsData, usersData]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Key Result Statistics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 font-medium">Key Result statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={calculatedData.keyResultsDistribution} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Net Confidence Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 font-medium">Net Confidence Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[200px]">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 120 120" className="w-full h-full">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#5bb498"
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - (calculatedData.confidenceData[0]?.count || 0) / Math.max(keyResultsData.length, 1))}
                  transform="rotate(-90 60 60)"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#f0c268"
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - (calculatedData.confidenceData[1]?.count || 0) / Math.max(keyResultsData.length, 1)) + 2 * Math.PI * 54 * ((calculatedData.confidenceData[0]?.count || 0) / Math.max(keyResultsData.length, 1))}
                  transform="rotate(-90 60 60)"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#e05d5d"
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - (calculatedData.confidenceData[2]?.count || 0) / Math.max(keyResultsData.length, 1)) + 2 * Math.PI * 54 * (((calculatedData.confidenceData[0]?.count || 0) + (calculatedData.confidenceData[1]?.count || 0)) / Math.max(keyResultsData.length, 1))}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-700">{calculatedData.netConfidenceScore}</div>
                  <div className="text-xs text-gray-500">NCS</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-4 w-full max-w-[180px]">
              {confidenceData.map((item, index) => (
                <div key={index} className="flex items-center text-xs">
                  <div
                    className="w-3 h-3 rounded-full mr-1"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="mr-1">{item.count}</span>
                  <span className="text-gray-500">{item.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Result Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 font-medium">Key Result progress</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[200px]">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 120 120" className="w-full h-full">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - 0.44)}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl font-bold text-gray-700">44%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Key Results vs. Tasks Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 font-medium">Key Results vs. Tasks progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={progressOverTime} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="keyResults" stroke="#06b6d4" name="Key Results progress" />
                <Line type="monotone" dataKey="tasks" stroke="#8b5cf6" name="Tasks progress" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Confidence Trends */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 font-medium">Confidence trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={confidenceTrends} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="onTrack" stackId="1" stroke="#5bb498" fill="#5bb498" />
                <Area type="monotone" dataKey="atRisk" stackId="1" stroke="#f0c268" fill="#f0c268" />
                <Area type="monotone" dataKey="offTrack" stackId="1" stroke="#e05d5d" fill="#e05d5d" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mt-8">Key Result details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Progress Key Results */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 font-medium">Top progress key results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topKeyResults.map((kr) => (
                <div key={kr.id} className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center mt-0.5">
                    <div 
                      className="w-4 h-4 rounded-sm"
                      style={{ backgroundColor: getStatusColor(kr.status) }}
                    ></div>
                  </div>
                  
                  <div className="flex-grow px-2">
                    <div className="text-sm mb-1">{kr.title}</div>
                    <div className="text-xs text-gray-500">{kr.meta}</div>
                  </div>

                  <div className="flex-shrink-0 flex items-center">
                    <div className={`font-medium text-sm mr-4 ${kr.progress < 0 ? 'text-green-600' : kr.progress > 80 ? 'text-amber-600' : 'text-blue-600'}`}>
                      {kr.progress < 0 ? '' : '+'}{kr.progress}%
                    </div>
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                      style={{ backgroundColor: kr.owner.color }}
                    >
                      {kr.owner.initials}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bottom Progress Key Results */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 font-medium">Bottom progress key results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bottomKeyResults.map((kr) => (
                <div key={kr.id} className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center mt-0.5">
                    <div 
                      className="w-4 h-4 rounded-sm"
                      style={{ backgroundColor: getStatusColor(kr.status) }}
                    ></div>
                  </div>
                  
                  <div className="flex-grow px-2">
                    <div className="text-sm mb-1">{kr.title}</div>
                    <div className="text-xs text-gray-500">{kr.meta}</div>
                  </div>

                  <div className="flex-shrink-0 flex items-center">
                    <div className="font-medium text-sm mr-4 text-amber-600">
                      {kr.progress}%
                    </div>
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                      style={{ backgroundColor: kr.owner.color }}
                    >
                      {kr.owner.initials}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KeyResultSummary;