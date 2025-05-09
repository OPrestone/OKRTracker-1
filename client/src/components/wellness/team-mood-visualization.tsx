import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smile, Meh, Frown, AlertTriangle, ThumbsUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

type MoodEntry = {
  id: number;
  userId: number;
  moodScore: number;
  notes: string | null;
  date: string;
  createdAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    teamId: number | null;
  };
};

type TeamMoodVisualizationProps = {
  teamId?: number;
  showIndividualMoods?: boolean;
  days?: number;
  height?: number;
};

const getMoodIcon = (score: number) => {
  switch (score) {
    case 1:
      return <Frown className="text-red-500" />;
    case 2:
      return <AlertTriangle className="text-orange-500" />;
    case 3:
      return <Meh className="text-yellow-500" />;
    case 4:
      return <Smile className="text-green-500" />;
    case 5:
      return <ThumbsUp className="text-blue-500" />;
    default:
      return <Meh className="text-gray-500" />;
  }
};

const getMoodText = (score: number) => {
  switch (score) {
    case 1:
      return "Very Unhappy";
    case 2:
      return "Unhappy";
    case 3:
      return "Neutral";
    case 4:
      return "Happy";
    case 5:
      return "Very Happy";
    default:
      return "Unknown";
  }
};

const TeamMoodVisualization = ({ 
  teamId,
  showIndividualMoods = true,
  days = 14,
  height = 300
}: TeamMoodVisualizationProps) => {
  const { user } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState(`${days}`);
  
  // Use authenticated user's team if teamId is not provided
  const effectiveTeamId = teamId || user?.teamId;
  
  // Fetch mood data based on team membership
  const { data: moodEntries, isLoading, error } = useQuery({
    queryKey: ["/api/mood-entries/team", effectiveTeamId],
    queryFn: async () => {
      if (!effectiveTeamId) {
        throw new Error("No team selected");
      }
      const response = await fetch(`/api/mood-entries/team/${effectiveTeamId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch team mood data");
      }
      return response.json() as Promise<MoodEntry[]>;
    },
    enabled: !!effectiveTeamId,
  });

  // Process data for the chart
  const processedData = (() => {
    if (!moodEntries) return [];
    
    // Filter entries for the selected timeframe
    const daysInMilliseconds = parseInt(selectedTimeframe) * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - daysInMilliseconds);
    
    // Group entries by date
    const entriesByDate = moodEntries
      .filter(entry => new Date(entry.date) >= cutoffDate)
      .reduce((acc, entry) => {
        const dateStr = new Date(entry.date).toLocaleDateString();
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push(entry);
        return acc;
      }, {} as Record<string, MoodEntry[]>);
    
    // Create chart data
    return Object.entries(entriesByDate).map(([date, entries]) => {
      const avgMood = entries.reduce((sum, entry) => sum + entry.moodScore, 0) / entries.length;
      
      // Add individual team member moods when we show individual data
      const individualData: Record<string, number> = {};
      if (showIndividualMoods) {
        entries.forEach(entry => {
          if (entry.user) {
            const name = `${entry.user.firstName} ${entry.user.lastName}`;
            individualData[name] = entry.moodScore;
          }
        });
      }
      
      return {
        date,
        avgMood: parseFloat(avgMood.toFixed(1)),
        ...individualData
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  })();
  
  // Calculate overall team mood
  const teamMood = moodEntries?.length 
    ? Math.round(moodEntries.reduce((sum, entry) => sum + entry.moodScore, 0) / moodEntries.length) 
    : null;
  
  // Generate colors for individual team members
  const teamMemberColors = [
    "#3B82F6", // blue
    "#10B981", // green
    "#F59E0B", // amber
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#06B6D4", // cyan
    "#F97316", // orange
  ];

  const timeframeOptions = [
    { label: "Last 7 days", value: "7" },
    { label: "Last 14 days", value: "14" },
    { label: "Last 30 days", value: "30" },
    { label: "Last 90 days", value: "90" },
  ];

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Wellness Pulse</CardTitle>
          <CardDescription>Error loading team mood data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">
            {error instanceof Error ? error.message : "An error occurred while loading team mood data"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Team Wellness Pulse</CardTitle>
          <CardDescription>Track your team's mood over time</CardDescription>
        </div>
        
        <div className="flex items-center gap-4">
          {!isLoading && teamMood && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Current Mood:</span>
              <div className="w-8 h-8">
                {getMoodIcon(teamMood)}
              </div>
            </div>
          )}
          
          <Select 
            value={selectedTimeframe} 
            onValueChange={setSelectedTimeframe}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              {timeframeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : processedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <p>No mood data available for the selected timeframe.</p>
            <p className="text-sm mt-2">Try selecting a different timeframe or encourage team members to submit mood entries.</p>
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={processedData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
                <Tooltip
                  formatter={(value, name) => {
                    const numValue = Number(value);
                    const displayName = name === "avgMood" ? "Team Average" : name;
                    return [
                      <span>
                        {numValue.toFixed(1)} - {getMoodText(Math.round(numValue))}
                      </span>,
                      displayName
                    ];
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                
                {/* Team Average Line */}
                <Area
                  type="monotone"
                  dataKey="avgMood"
                  name="Team Average"
                  stroke="#0F172A"
                  fill="#0F172A"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                
                {/* Individual Lines (if showing individual moods) */}
                {showIndividualMoods && processedData.length > 0 && 
                  Object.keys(processedData[0])
                    .filter(key => key !== "date" && key !== "avgMood")
                    .map((name, index) => (
                      <Area
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={teamMemberColors[index % teamMemberColors.length]}
                        fill={teamMemberColors[index % teamMemberColors.length]}
                        fillOpacity={0.1}
                        strokeWidth={1.5}
                        strokeDasharray="5 5"
                      />
                    ))
                }
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {!isLoading && (
          <div className="mt-6 grid grid-cols-5 gap-2 text-center">
            {[1, 2, 3, 4, 5].map(score => (
              <div 
                key={score} 
                className="flex flex-col items-center py-2 px-1 rounded-md bg-muted/30"
              >
                <div className="w-6 h-6 mb-1">
                  {getMoodIcon(score)}
                </div>
                <span className="text-xs font-medium">{getMoodText(score)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamMoodVisualization;