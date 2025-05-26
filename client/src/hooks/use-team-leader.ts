import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export function useTeamLeader() {
  const { user } = useAuth();

  const { data: isTeamLeader, isLoading, error } = useQuery({
    queryKey: ['/api/user/is-team-leader', user?.id],
    enabled: !!user?.id,
  });

  const { data: leaderTeams, isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/teams/leader', user?.id],
    enabled: !!user?.id && !!isTeamLeader,
  });

  return {
    isTeamLeader: !!isTeamLeader,
    leaderTeams: leaderTeams || [],
    isLoading: isLoading || teamsLoading,
    error
  };
}