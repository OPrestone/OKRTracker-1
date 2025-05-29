import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';

interface ProgressTrendData {
  date: string;
  progress: number;
  totalObjectives: number;
  completedObjectives: number;
  timestamp: number;
}

interface TrendSummary {
  startProgress: number;
  endProgress: number;
  totalObjectives: number;
  avgProgress: number;
}

interface ProgressTrendsResponse {
  period: number;
  type: string;
  data: ProgressTrendData[];
  summary: TrendSummary;
}

interface EnhancedTrendChartProps {
  tenantId?: string;
  defaultPeriod?: number;
  height?: number;
  showControls?: boolean;
}

export function EnhancedTrendChart({ 
  tenantId, 
  defaultPeriod = 30, 
  height = 200, 
  showControls = true 
}: EnhancedTrendChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
  
  const { data: trendsData, isLoading, error } = useQuery<ProgressTrendsResponse>({
    queryKey: ['/api/progress-trends', tenantId, selectedPeriod],
    enabled: !!tenantId,
    refetchInterval: 60000, // Refetch every minute for fresh data
  });

  // Format data for the chart
  const chartData = trendsData?.data?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    progress: Math.round(item.progress * 10) / 10,
    objectives: item.totalObjectives,
    completed: item.completedObjectives,
    fullDate: item.date,
    timestamp: item.timestamp
  })) || [];

  // Calculate trend direction
  const trendDirection = trendsData?.summary ? 
    trendsData.summary.endProgress - trendsData.summary.startProgress : 0;
  
  const trendPercentage = trendsData?.summary.startProgress ? 
    Math.round(((trendsData.summary.endProgress - trendsData.summary.startProgress) / trendsData.summary.startProgress) * 100) : 0;

  const periodOptions = [
    { value: 7, label: '7 Days' },
    { value: 14, label: '2 Weeks' },
    { value: 30, label: '30 Days' },
    { value: 60, label: '2 Months' },
    { value: 90, label: '3 Months' }
  ];

  // Custom tooltip for detailed information
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.fullDate}</p>
          <p className="text-sm text-blue-600">
            Progress: {data.progress}%
          </p>
          <p className="text-sm text-gray-600">
            Objectives: {data.objectives} ({data.completed} completed)
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Progress Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Progress Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Unable to load trend data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Progress Trends
          </CardTitle>
          {showControls && (
            <div className="flex gap-2">
              {periodOptions.map(option => (
                <Button
                  key={option.value}
                  variant={selectedPeriod === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(option.value)}
                  className="text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        {/* Trend Summary */}
        {trendsData?.summary && (
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              {trendDirection >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${
                trendDirection >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trendDirection >= 0 ? '+' : ''}{trendPercentage}%
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Average: {Math.round(trendsData.summary.avgProgress * 10) / 10}%
            </div>
            <div className="text-sm text-gray-600">
              {trendsData.summary.totalObjectives} objectives
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="progress"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#progressGradient)"
              dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Additional Insights */}
        {chartData.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-gray-900">
                {chartData[0]?.progress}%
              </div>
              <div className="text-gray-500">Start</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">
                {chartData[chartData.length - 1]?.progress}%
              </div>
              <div className="text-gray-500">Current</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">
                {Math.round(trendsData?.summary.avgProgress || 0)}%
              </div>
              <div className="text-gray-500">Average</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Simplified version for dashboard cards
export function MiniTrendChart({ 
  tenantId, 
  period = 7,
  height = 60 
}: { 
  tenantId?: string; 
  period?: number;
  height?: number;
}) {
  const { data: trendsData } = useQuery<ProgressTrendsResponse>({
    queryKey: ['/api/progress-trends', tenantId, period],
    enabled: !!tenantId,
    refetchInterval: 120000, // Refetch every 2 minutes
  });

  const chartData = trendsData?.data?.map(item => ({
    progress: item.progress,
    date: item.date
  })) || [];

  if (chartData.length === 0) {
    return <div className="h-12 bg-gray-100 rounded animate-pulse"></div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="miniProgressGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="progress"
          stroke="#6366f1"
          strokeWidth={1.5}
          fill="url(#miniProgressGradient)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}