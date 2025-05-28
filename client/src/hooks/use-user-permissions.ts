import { useTenantContext } from "./use-tenant-context";
import { useAuth } from "./use-auth";

/**
 * Hook to check user permissions within the current tenant
 * 
 * This hook provides utility functions to check if a user has specific permissions
 * based on their role in the current tenant (owner, admin, or member)
 */
export function useUserPermissions() {
  const { user } = useAuth();
  const { currentTenant } = useTenantContext();
  
  /**
   * Check if the user is an admin or owner of the current tenant
   * @returns boolean indicating if the user has admin/owner permissions
   */
  const isAdminOrOwner = (): boolean => {
    if (!user || !currentTenant) return false;
    
    // Global system admin check
    if (user.isAdmin) return true;
    
    // Check user's role in the current tenant
    if (user.tenants) {
      const tenantMembership = user.tenants.find(t => t.id === currentTenant.id);
      if (tenantMembership && (tenantMembership.userRole === 'owner' || tenantMembership.userRole === 'admin')) {
        return true;
      }
    }
    
    return false;
  };
  
  /**
   * Check if the user is an owner of the current tenant
   * @returns boolean indicating if the user has owner permissions
   */
  const isOwner = (): boolean => {
    if (!user || !currentTenant) return false;
    
    // Check user's role in the current tenant
    if (user.tenants) {
      const tenantMembership = user.tenants.find(t => t.id === currentTenant.id);
      if (tenantMembership && tenantMembership.userRole === 'owner') {
        return true;
      }
    }
    
    return false;
  };
  
  /**
   * Check if the user is a team leader
   * @returns boolean indicating if the user is a team leader
   */
  const isTeamLeader = (): boolean => {
    if (!user || !currentTenant) return false;
    
    // Check if user has team leader role
    if (user.tenants) {
      const tenantMembership = user.tenants.find(t => t.id === currentTenant.id);
      if (tenantMembership && tenantMembership.userRole === 'manager') {
        return true;
      }
    }
    
    return false;
  };

  /**
   * Check if the user is a manager or above (manager, executive, admin, owner)
   * @returns boolean indicating if the user has manager+ permissions
   */
  const isManagerOrAbove = (): boolean => {
    if (!user || !currentTenant) return false;
    
    // Global system admin check
    if (user.isAdmin) return true;
    
    // Check user's role in the current tenant
    if (user.tenants) {
      const tenantMembership = user.tenants.find(t => t.id === currentTenant.id);
      if (tenantMembership) {
        const role = tenantMembership.userRole;
        return ['owner', 'admin', 'executive', 'manager'].includes(role || '');
      }
    }
    
    return false;
  };

  /**
   * Check if the user is an executive or above (executive, admin, owner)
   * @returns boolean indicating if the user has executive+ permissions
   */
  const isExecutiveOrAbove = (): boolean => {
    if (!user || !currentTenant) return false;
    
    // Global system admin check
    if (user.isAdmin) return true;
    
    // Check user's role in the current tenant
    if (user.tenants) {
      const tenantMembership = user.tenants.find(t => t.id === currentTenant.id);
      if (tenantMembership) {
        const role = tenantMembership.userRole;
        return ['owner', 'admin', 'executive'].includes(role || '');
      }
    }
    
    return false;
  };

  /**
   * Get the user's role in the current tenant
   * @returns string representing the user's role
   */
  const getUserRole = (): string => {
    if (!user || !currentTenant) return 'user';
    
    if (user.isAdmin) return 'admin';
    
    if (user.tenants) {
      const tenantMembership = user.tenants.find(t => t.id === currentTenant.id);
      return tenantMembership?.userRole || 'user';
    }
    
    return 'user';
  };

  // Permission checks for specific actions - Updated per user requirements
  const canCreateObjectives = (): boolean => {
    // Only managers can create "My OKRs"
    const role = getUserRole();
    return role === 'manager';
  };
  const canEditObjectives = (): boolean => isManagerOrAbove() || isTeamLeader();
  const canDeleteObjectives = (): boolean => isAdminOrOwner();
  const canCreateTeams = (): boolean => {
    // Manager, owner and admin can create teams
    const role = getUserRole();
    return ['manager', 'admin', 'owner'].includes(role) || user?.isAdmin;
  };
  const canEditTeams = (): boolean => {
    // Team leaders, executives, owners and admins can add members to teams
    const role = getUserRole();
    return ['executive', 'admin', 'owner'].includes(role) || user?.isAdmin || isTeamLeader();
  };
  const canDeleteTeams = (): boolean => isAdminOrOwner();
  const canManageUsers = (): boolean => {
    // Manager, owner and admin can create users
    const role = getUserRole();
    return ['manager', 'admin', 'owner'].includes(role) || user?.isAdmin;
  };
  const canViewReports = (): boolean => isManagerOrAbove();
  const canAccessConfiguration = (): boolean => isAdminOrOwner();
  const canManageIntegrations = (): boolean => isAdminOrOwner();
  const canExportData = (): boolean => isExecutiveOrAbove();
  const canViewFinancials = (): boolean => isExecutiveOrAbove();
  const canAssignTeamLeaders = (): boolean => isAdminOrOwner();
  const canCreateCompanyObjectives = (): boolean => {
    // Only executive, owner and admin can create company OKRs
    const role = getUserRole();
    return ['executive', 'admin', 'owner'].includes(role) || user?.isAdmin;
  };
  const canApproveObjectives = (): boolean => isManagerOrAbove();
  
  return {
    // Role checks
    isAdminOrOwner,
    isOwner,
    isTeamLeader,
    isManagerOrAbove,
    isExecutiveOrAbove,
    getUserRole,
    
    // Permission checks
    canCreateObjectives,
    canEditObjectives,
    canDeleteObjectives,
    canCreateTeams,
    canEditTeams,
    canDeleteTeams,
    canManageUsers,
    canViewReports,
    canAccessConfiguration,
    canManageIntegrations,
    canExportData,
    canViewFinancials,
    canAssignTeamLeaders,
    canCreateCompanyObjectives,
    canApproveObjectives
  };
}