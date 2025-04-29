import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";

interface TeamItemProps {
  name: string;
  memberCount: number;
  performance: number;
  initials: string;
  bgColor: string;
  textColor: string;
}

function TeamItem({ name, memberCount, performance, initials, bgColor, textColor }: TeamItemProps) {
  // Determine color for progress bar
  const getProgressColor = (performance: number) => {
    if (performance >= 85) return "bg-green-500";
    if (performance >= 70) return "bg-primary-500";
    return "bg-amber-500";
  };

  return (
    <div className="flex items-center justify-between mb-4 last:mb-0">
      <div className="flex items-center">
        <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center ${textColor} font-medium text-sm`}>
          {initials}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-neutral-800">{name}</p>
          <p className="text-xs text-neutral-500">{memberCount} members</p>
        </div>
      </div>
      <div className="flex items-center">
        <span className="text-sm font-medium text-neutral-700 mr-2">{performance}%</span>
        <div className="w-24 bg-neutral-200 rounded-full h-2">
          <div 
            className={`${getProgressColor(performance)} h-2 rounded-full`} 
            style={{ width: `${performance}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function TeamPerformance() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/teams'],
  });

  // Background and text colors for team avatars
  const teamColors = [
    { bg: "bg-primary-100", text: "text-primary-700" },
    { bg: "bg-indigo-100", text: "text-indigo-700" },
    { bg: "bg-amber-100", text: "text-amber-700" },
    { bg: "bg-rose-100", text: "text-rose-700" },
    { bg: "bg-green-100", text: "text-green-700" },
    { bg: "bg-purple-100", text: "text-purple-700" }
  ];

  return (
    <Card>
      <CardHeader className="px-5 py-4 flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-neutral-900">Team Performance</CardTitle>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="p-5">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between mb-4 last:mb-0">
                <div className="flex items-center">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="ml-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16 mt-1" />
                  </div>
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-4 w-8 mr-2" />
                  <Skeleton className="h-2 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </>
        ) : error ? (
          <div className="text-red-500">Error loading teams</div>
        ) : (
          <>
            {data && data.map((team: any, index: number) => (
              <TeamItem 
                key={team.id}
                name={team.name}
                memberCount={team.memberCount}
                performance={team.performance}
                initials={getInitials(team.name)}
                bgColor={teamColors[index % teamColors.length].bg}
                textColor={teamColors[index % teamColors.length].text}
              />
            ))}
          </>
        )}
      </CardContent>
      <div className="px-5 py-3 border-t border-neutral-200">
        <a href="/teams" className="text-sm font-medium text-primary-600 hover:text-primary-800">
          View all teams
        </a>
      </div>
    </Card>
  );
}
