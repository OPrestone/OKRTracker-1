import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Define the team interface
interface Team {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  members_count?: number;
}

interface TeamSelectionSectionProps {
  tenantId: string;
  value: string[];
  onChange: (selectedTeams: string[]) => void;
}

const TeamSelectionSection: React.FC<TeamSelectionSectionProps> = ({ 
  tenantId, 
  value = [],
  onChange
}) => {
  const [selectedTeams, setSelectedTeams] = useState<string[]>(value);

  // Fetch teams for the current tenant with proper authentication
  const { data: teams = [], isLoading, error } = useQuery<Team[]>({
    queryKey: ['/api/teams', tenantId],
    enabled: !!tenantId,
    meta: { requiresTenant: true },
  });

  // Update local state when external value changes
  useEffect(() => {
    setSelectedTeams(value);
  }, [value]);

  // Handle team selection
  const handleTeamSelection = (teamId: string) => {
    const updatedSelection = selectedTeams.includes(teamId)
      ? selectedTeams.filter(id => id !== teamId)
      : [...selectedTeams, teamId];
    
    setSelectedTeams(updatedSelection);
    onChange(updatedSelection);
  };

  // Generate team initials for avatar fallback
  const getTeamInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Generate a color based on the team's color or a default
  const getTeamColor = (team: Team) => {
    return team.color || '#3b82f6';  // default to blue if no color specified
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="cursor-not-allowed opacity-60">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[180px]" />
                  <Skeleton className="h-3 w-[120px]" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-md">
        <p>Failed to load teams. Please try again later.</p>
      </div>
    );
  }

  // Render empty state
  if (teams.length === 0) {
    return (
      <div className="p-6 text-center border border-dashed rounded-lg">
        <Users className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-4 text-lg font-medium">No teams found</h3>
        <p className="mt-1 text-sm text-gray-500">
          You need to create teams before you can include them in your OKR system.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {teams.map((team) => {
        const isSelected = selectedTeams.includes(team.id);
        const teamColor = getTeamColor(team);
        
        return (
          <Card 
            key={team.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              isSelected ? 'ring-2 ring-primary shadow-sm' : 'hover:border-gray-300'
            }`}
            onClick={() => handleTeamSelection(team.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Avatar style={{ backgroundColor: teamColor }}>
                  <AvatarFallback className="text-white">
                    {team.icon || getTeamInitials(team.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{team.name}</h4>
                    {isSelected && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {team.description || `Team in ${team.name} department`}
                  </p>
                  {team.members_count && (
                    <Badge variant="outline" className="mt-2">
                      {team.members_count} member{team.members_count !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TeamSelectionSection;