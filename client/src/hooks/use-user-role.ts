import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export type UserRole = "ceo" | "management" | "team_leader" | "owner" | "admin" | "member";

export function useUserRole() {
  const { user } = useAuth();

  const { data: roleData, isLoading, error } = useQuery({
    queryKey: ['/api/user/role', user?.id],
    enabled: !!user?.id,
  });

  return {
    userRole: roleData?.role as UserRole,
    permissions: roleData?.permissions || [],
    canEditMission: roleData?.permissions?.includes('edit_mission') || false,
    canEditStrategy: roleData?.permissions?.includes('edit_strategy') || false,
    canManageUsers: roleData?.permissions?.includes('manage_users') || false,
    canViewAnalytics: roleData?.permissions?.includes('view_analytics') || false,
    isLoading,
    error
  };
}