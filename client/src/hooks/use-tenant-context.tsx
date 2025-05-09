import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

// Define tenant type (should match what comes from the API)
export type Tenant = {
  id: number;
  name: string;
  displayName: string;
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
  switchTenant: (tenant: Tenant) => void;
};

const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
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

  // Initialize from session storage on component mount
  useEffect(() => {
    const storedTenantId = sessionStorage.getItem('currentTenantId');
    if (storedTenantId) {
      // We have a stored tenant ID, but we'll wait for the tenants to load
      // before we can fully restore the tenant object with all its properties
      console.log('Found stored tenant ID:', storedTenantId);
    }
  }, []);

  // Find and set the current tenant based on URL path or session storage
  useEffect(() => {
    if (!tenants || tenants.length === 0) return;
    
    // First priority: Check for stored tenant ID from session storage
    // This ensures tenant context persists after page reloads
    const storedTenantId = sessionStorage.getItem('currentTenantId');
    if (storedTenantId) {
      const tenantId = parseInt(storedTenantId);
      const matchedTenant = tenants.find(t => t.id === tenantId);
      if (matchedTenant) {
        setCurrentTenant(matchedTenant);
        return;
      }
    }
    
    // Second priority: Check URL paths
    
    // Check for numeric tenant ID in /tenants/{id}
    const numericMatch = location.match(/\/tenants\/(\d+)/);
    if (numericMatch) {
      const tenantId = parseInt(numericMatch[1]);
      const matchedTenant = tenants.find(t => t.id === tenantId);
      if (matchedTenant) {
        setCurrentTenant(matchedTenant);
        // Update session storage to match URL
        sessionStorage.setItem('currentTenantId', matchedTenant.id.toString());
        sessionStorage.setItem('currentTenantSlug', matchedTenant.slug);
        sessionStorage.setItem('currentTenantName', matchedTenant.displayName || matchedTenant.name);
        return;
      }
    }
    
    // Check for organization slug in /organization/{slug}
    const orgMatch = location.match(/\/organization\/([^/]+)/);
    if (orgMatch) {
      const urlSlug = orgMatch[1];
      const matchedTenant = tenants.find(t => t.slug === urlSlug);
      if (matchedTenant) {
        setCurrentTenant(matchedTenant);
        // Update session storage to match URL
        sessionStorage.setItem('currentTenantId', matchedTenant.id.toString());
        sessionStorage.setItem('currentTenantSlug', matchedTenant.slug);
        sessionStorage.setItem('currentTenantName', matchedTenant.displayName || matchedTenant.name);
        return;
      }
    }
    
    // Check for legacy tenant slug in /tenants/{slug}
    const tenantMatch = location.match(/\/tenants\/([^/]+)/);
    if (tenantMatch && !numericMatch) { // Ensure we're not matching a numeric ID again
      const urlSlug = tenantMatch[1];
      const matchedTenant = tenants.find(t => t.slug === urlSlug);
      if (matchedTenant) {
        setCurrentTenant(matchedTenant);
        // Update session storage to match URL
        sessionStorage.setItem('currentTenantId', matchedTenant.id.toString());
        sessionStorage.setItem('currentTenantSlug', matchedTenant.slug);
        sessionStorage.setItem('currentTenantName', matchedTenant.displayName || matchedTenant.name);
        return;
      }
    }
    
    // Otherwise, use default tenant or first one
    const defaultTenant = tenants.find(t => t.isDefault) || tenants[0];
    if (defaultTenant) {
      setCurrentTenant(defaultTenant);
      // Update session storage with default tenant
      sessionStorage.setItem('currentTenantId', defaultTenant.id.toString());
      sessionStorage.setItem('currentTenantSlug', defaultTenant.slug);
      sessionStorage.setItem('currentTenantName', defaultTenant.displayName || defaultTenant.name);
    }
  }, [tenants, location]);

  // Function to switch tenant with full page reload
  const switchTenant = (tenant: Tenant) => {
    // First, update the context
    setCurrentTenant(tenant);
    
    // Store the tenant ID in session storage to make it available after page reload
    // This is used by the queryClient to add tenantId to API requests
    sessionStorage.setItem('currentTenantId', tenant.id.toString());
    
    // Also store other important tenant data that might be needed before API calls
    sessionStorage.setItem('currentTenantSlug', tenant.slug);
    sessionStorage.setItem('currentTenantName', tenant.displayName || tenant.name);
    
    // Determine the URL to navigate to
    let newUrl = '';
    
    // Handle organization routes
    if (location.startsWith('/organization/')) {
      newUrl = location.replace(/\/organization\/[^/]+/, `/organization/${tenant.slug}`);
    } 
    // Handle tenant ID-based routes
    else if (location.match(/\/tenants\/\d+/)) {
      newUrl = `/organization/${tenant.slug}`;
    } 
    // Handle tenant slug-based routes (legacy)
    else if (location.startsWith('/tenants/')) {
      newUrl = location.replace(/\/tenants\/[^/]+/, `/organization/${tenant.slug}`);
    } 
    // Default navigation to organization page with slug
    else {
      newUrl = `/organization/${tenant.slug}`;
    }
    
    // Invalidate all queries before reloading to ensure fresh data
    // for the new tenant context
    try {
      const queryClient = window.__REACT_QUERY_GLOBAL_CLIENT__;
      if (queryClient) {
        queryClient.invalidateQueries();
      }
    } catch (e) {
      console.warn('Could not invalidate queries before tenant switch:', e);
    }
    
    // Force a full page reload to reset app state
    window.location.href = newUrl;
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        setCurrentTenant,
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