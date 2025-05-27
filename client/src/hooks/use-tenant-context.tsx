import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient"; // Import queryClient directly

// Add global declarations for window.__queryClient__ property
declare global {
  interface Window {
    __queryClient__?: any;
    __TANSTACK_QUERY_CLIENT__?: any;
  }
}

// Define tenant type (should match what comes from the API)
export type Tenant = {
  id: string; // Changed from number to string to match ULID format
  name: string;
  display_name: string;
  slug: string;
  userRole?: string;
  isDefault?: boolean;
  plan?: string;
  status?: string;
};

type TenantContextType = {
  currentTenant: Tenant | null;
  isLoading: boolean;
  error: Error | null;
  setCurrentTenant: (tenant: Tenant) => void;
  setCurrentTenantById: (id: string) => void;
  switchTenant: (tenant: Tenant) => void;
};

const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({ 
  children,
  onProviderReady
}: { 
  children: ReactNode,
  onProviderReady?: (setTenantFn: (tenant: Tenant) => void) => void 
}) {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [location] = useLocation();

  // Fetch available tenants
  const {
    data: tenants,
    error,
    isLoading,
  } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
    enabled: true,
  });

  // Initialize from session storage on component mount and notify parent via callback
  useEffect(() => {
    const storedTenantId = sessionStorage.getItem('currentTenantId');
    if (storedTenantId) {
      // We have a stored tenant ID, but we'll wait for the tenants to load
      // before we can fully restore the tenant object with all its properties
      console.log('Found stored tenant ID:', storedTenantId);
    }
    
    // Notify the parent component that the provider is ready
    if (onProviderReady) {
      onProviderReady(setCurrentTenant);
    }
  }, [onProviderReady]);

  // Find and set the current tenant based on URL path or session storage
  useEffect(() => {
    if (!tenants || tenants.length === 0) return;
    
    // First priority: Check for stored tenant ID from session storage
    // This ensures tenant context persists after page reloads
    const storedTenantId = sessionStorage.getItem('currentTenantId');
    if (storedTenantId) {
      // No need to parse as int since IDs are now strings (ULIDs)
      const matchedTenant = tenants.find(t => t.id === storedTenantId);
      if (matchedTenant) {
        setCurrentTenant(matchedTenant);
        return;
      }
    }
    
    // Second priority: Check URL paths
    
    // Check for tenant ID in /tenants/{id} - now looking for ULID pattern
    // ULIDs are 26 characters, alphanumeric, all uppercase
    const idMatch = location.match(/\/tenants\/([A-Z0-9]{26})/);
    if (idMatch) {
      const tenantId = idMatch[1];
      const matchedTenant = tenants.find(t => t.id === tenantId);
      if (matchedTenant) {
        setCurrentTenant(matchedTenant);
        // Update session storage to match URL
        sessionStorage.setItem('currentTenantId', matchedTenant.id);
        sessionStorage.setItem('currentTenantSlug', matchedTenant.slug);
        sessionStorage.setItem('currentTenantName', matchedTenant.display_name || matchedTenant.name);
        return;
      }
    }
    // Check for ULID in /ulid/{id} (new format)
    const ulidMatch = location.match(/\/ulid\/([A-Z0-9]{26})/);
    if (ulidMatch) {
      const tenantId = ulidMatch[1];
      const matchedTenant = tenants.find(t => t.id === tenantId);
      if (matchedTenant) {
        setCurrentTenant(matchedTenant);
        // Update session storage to match URL
        sessionStorage.setItem('currentTenantId', matchedTenant.id);
        sessionStorage.setItem('currentTenantSlug', matchedTenant.slug);
        sessionStorage.setItem('currentTenantName', matchedTenant.display_name || matchedTenant.name);
        return;
      }
    }
    
    // Check for organization slug in /organization/{slug} (legacy format)
    const orgMatch = location.match(/\/organization\/([^/]+)/);
    if (orgMatch) {
      const urlSlug = orgMatch[1];
      const matchedTenant = tenants.find(t => t.slug === urlSlug);
      if (matchedTenant) {
        setCurrentTenant(matchedTenant);
        // Update session storage to match URL
        sessionStorage.setItem('currentTenantId', matchedTenant.id);
        sessionStorage.setItem('currentTenantSlug', matchedTenant.slug);
        sessionStorage.setItem('currentTenantName', matchedTenant.display_name || matchedTenant.name);
        return;
      }
    }
    
    // Check for legacy tenant slug in /tenants/{slug}
    const tenantMatch = location.match(/\/tenants\/([^/]+)/);
    if (tenantMatch && !idMatch && !ulidMatch) { // Ensure we're not matching a ULID or numeric ID again
      const urlSlug = tenantMatch[1];
      const matchedTenant = tenants.find(t => t.slug === urlSlug);
      if (matchedTenant) {
        setCurrentTenant(matchedTenant);
        // Update session storage to match URL
        sessionStorage.setItem('currentTenantId', matchedTenant.id);
        sessionStorage.setItem('currentTenantSlug', matchedTenant.slug);
        sessionStorage.setItem('currentTenantName', matchedTenant.display_name || matchedTenant.name);
        return;
      }
    }
    
    // Otherwise, use default tenant or first one
    const defaultTenant = tenants.find(t => t.isDefault) || tenants[0];
    if (defaultTenant) {
      setCurrentTenant(defaultTenant);
      // Update session storage with default tenant
      sessionStorage.setItem('currentTenantId', defaultTenant.id); // No need for toString as it's already a string
      sessionStorage.setItem('currentTenantSlug', defaultTenant.slug);
      sessionStorage.setItem('currentTenantName', defaultTenant.display_name || defaultTenant.name);
    }
  }, [tenants, location]);

  // Function to switch tenant with full page reload
  const switchTenant = (tenant: Tenant) => {
    // First, update the context
    setCurrentTenant(tenant);
    
    // Store the tenant ID in session storage to make it available after page reload
    // This is used by the queryClient to add tenantId to API requests
    sessionStorage.setItem('currentTenantId', tenant.id); // No need for toString as it's already a string ULID
    
    // Also store other important tenant data that might be needed before API calls
    sessionStorage.setItem('currentTenantSlug', tenant.slug);
    sessionStorage.setItem('currentTenantName', tenant.display_name || tenant.name);
    
    // Determine the URL to navigate to
    let newUrl = '';
    
    // Handle direct ID-based routes
    if (location.match(/^\/[A-Z0-9]{26}/)) {
      newUrl = location.replace(/^\/[A-Z0-9]{26}/, `/${tenant.id}`);
    }
    // Handle organization routes (legacy format)
    else if (location.startsWith('/organization/')) {
      newUrl = location.replace(/\/organization\/[^/]+/, `/${tenant.id}`);
    } 
    // Handle legacy ULID-based routes
    else if (location.startsWith('/ulid/')) {
      newUrl = location.replace(/\/ulid\/[A-Z0-9]{26}/, `/${tenant.id}`);
    }
    // Handle tenant ID-based routes - updated pattern for ULIDs
    else if (location.match(/\/tenants\/[A-Z0-9]{26}/)) {
      newUrl = `/${tenant.id}`;
    } 
    // Handle tenant slug-based routes (legacy)
    else if (location.startsWith('/tenants/')) {
      newUrl = location.replace(/\/tenants\/[^/]+/, `/${tenant.id}`);
    } 
    // Default navigation to new direct ID-based format
    else {
      newUrl = `/${tenant.id}`;
    }
    
    // Invalidate all queries before reloading to ensure fresh data
    try {
      // Use the imported queryClient directly
      queryClient.invalidateQueries({ queryKey: [] }); // Invalidate all queries
    } catch (e) {
      console.warn('Could not invalidate queries before tenant switch:', e);
    }
    
    // Force a full page reload to reset app state
    window.location.href = newUrl;
  };

  // Function to set the current tenant by ID
  const setCurrentTenantById = (id: string) => {
    if (!tenants) return;
    
    const tenant = tenants.find(t => t.id === id);
    if (tenant) {
      setCurrentTenant(tenant);
      // Update session storage
      sessionStorage.setItem('currentTenantId', tenant.id);
      sessionStorage.setItem('currentTenantSlug', tenant.slug);
      sessionStorage.setItem('currentTenantName', tenant.display_name || tenant.name);
    } else {
      console.warn(`Tenant with ID ${id} not found`);
    }
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        setCurrentTenant,
        setCurrentTenantById,
        switchTenant,
        isLoading,
        error: error as Error | null,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenantContext must be used within a TenantProvider");
  }
  return context;
}