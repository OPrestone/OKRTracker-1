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
   * Check if the user has permission to create objectives
   * @returns boolean indicating if the user can create objectives
   */
  const canCreateObjectives = (): boolean => {
    return isAdminOrOwner();
  };
  
  return {
    isAdminOrOwner,
    isOwner,
    canCreateObjectives
  };
}