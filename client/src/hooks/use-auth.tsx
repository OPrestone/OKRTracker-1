import { createContext, ReactNode, useContext, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser, Tenant } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getRedirectPath, clearRedirectPath } from "@/lib/redirect-service";
import { useTenantContext } from "./use-tenant-context";

// Enhanced user type with tenant information
interface EnhancedUser extends SelectUser {
  tenants?: Array<Tenant & { userRole?: string }>;
  defaultTenant?: string;
  isAdmin?: boolean;
  firstName?: string;
  lastName?: string;
  username?: string;
  name?: string;
  role?: string;
}

type AuthContextType = {
  user: EnhancedUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<EnhancedUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<EnhancedUser, Error, InsertUser>;
  refetchUser: () => Promise<void>;
  hasTenantsAccess: boolean;
};

type LoginData = {
  username: string;
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);
// Create a specialized version of AuthProvider that doesn't depend directly on TenantContext
// This avoids circular dependency issues
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Get tenant context safely - if it fails, provide fallback functions
  const tenantContext = (() => {
    try {
      return useTenantContext();
    } catch (e) {
      // Provide empty implementation if TenantContext is not available
      console.warn("TenantContext not available in AuthProvider");
      return {
        setCurrentTenant: () => {},
        currentTenant: null,
        switchTenant: () => {},
        isLoading: false,
        error: null
      };
    }
  })();
  
  const {
    data: user,
    error,
    isLoading,
    refetch
  } = useQuery<EnhancedUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Check if user has access to any tenants
  const hasTenantsAccess = !!(user?.tenants && user.tenants.length > 0);

  // When user data is loaded, update tenant information if available
  useEffect(() => {
    if (user?.tenants && user.tenants.length > 0 && user.defaultTenant) {
      // Find the default tenant object
      const defaultTenant = user.tenants.find(tenant => tenant.id === user.defaultTenant);
      if (defaultTenant) {
        // Update the current tenant in TenantContext
        tenantContext.setCurrentTenant(defaultTenant);
        console.log("Set default tenant from user data:", defaultTenant.name);
      }
    }
  }, [user, tenantContext]);

  const refetchUser = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: EnhancedUser) => {
      // Update user data in the query cache
      queryClient.setQueryData(["/api/user"], user);
      
      // Set default tenant if available
      if (user.tenants && user.tenants.length > 0) {
        // Find the user's default tenant
        const defaultTenantId = user.defaultTenant;
        const defaultTenant = defaultTenantId 
          ? user.tenants.find(t => t.id === defaultTenantId)
          : user.tenants[0];
          
        if (defaultTenant) {
          // Update tenant info in session storage
          sessionStorage.setItem('currentTenantId', defaultTenant.id);
          sessionStorage.setItem('currentTenantSlug', defaultTenant.slug);
          sessionStorage.setItem('currentTenantName', defaultTenant.displayName || defaultTenant.name);
          
          // Also trigger tenant refresh in tenant context
          tenantContext.setCurrentTenant(defaultTenant);
        }
      }
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });
      
      // Get the saved redirect path or default to homepage
      const redirectPath = getRedirectPath("/");
      
      // Navigate to the intended destination or home page
      navigate(redirectPath);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: EnhancedUser) => {
      queryClient.setQueryData(["/api/user"], user);
      
      // Check if user has tenant information after registration
      if (user.tenants && user.tenants.length > 0) {
        // Find the user's default tenant
        const defaultTenantId = user.defaultTenant;
        const defaultTenant = defaultTenantId 
          ? user.tenants.find(t => t.id === defaultTenantId)
          : user.tenants[0];
          
        if (defaultTenant) {
          // Update tenant info in session storage
          sessionStorage.setItem('currentTenantId', defaultTenant.id);
          sessionStorage.setItem('currentTenantSlug', defaultTenant.slug);
          sessionStorage.setItem('currentTenantName', defaultTenant.displayName || defaultTenant.name);
          
          // Also trigger tenant refresh in tenant context
          tenantContext.setCurrentTenant(defaultTenant);
        }
      }
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.name}!`,
      });
      
      // Clear any existing redirect paths - new users should always go to the dashboard
      clearRedirectPath();
      
      // Redirect to dashboard after successful registration for onboarding
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // First invalidate the query cache to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Then set the user to null
      queryClient.setQueryData(["/api/user"], null);
      
      // Clear tenant information from session storage
      sessionStorage.removeItem('currentTenantId');
      sessionStorage.removeItem('currentTenantSlug');
      sessionStorage.removeItem('currentTenantName');
      
      // Reset tenant context
      tenantContext.setCurrentTenant(null);
      
      // Clear any redirect paths
      clearRedirectPath();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Redirect to auth page after successful logout
      navigate("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        refetchUser,
        hasTenantsAccess
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}