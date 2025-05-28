import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Function to get the current tenant ID from the URL
export function getCurrentTenantFromUrl(): string | null {
  // First priority: Check for direct ULID in path /id format
  const directUlidMatch = window.location.pathname.match(/^\/([A-Z0-9]{26})/);
  if (directUlidMatch) {
    return directUlidMatch[1];
  }
  
  // Second priority: Check for legacy ULID in /ulid/{id} format
  const legacyUlidMatch = window.location.pathname.match(/\/ulid\/([A-Z0-9]{26})/);
  if (legacyUlidMatch) {
    return legacyUlidMatch[1];
  }
  
  // Third priority: Check for ULID tenant ID in /tenants/{id} pattern
  const tenantsUlidMatch = window.location.pathname.match(/\/tenants\/([A-Z0-9]{26})/);
  if (tenantsUlidMatch) {
    return tenantsUlidMatch[1];
  }
  
  // Fourth priority: For organization slug routes or non-URL encoded routes, 
  // rely on session storage which is set when switching tenants in the TenantProvider
  const storedTenantId = sessionStorage.getItem('currentTenantId');
  return storedTenantId || null;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get tenant ID from URL
  const tenantId = getCurrentTenantFromUrl();
  const urlObj = new URL(url, window.location.origin);
  
  // Prepare headers
  const headers: HeadersInit = data ? { "Content-Type": "application/json" } : {};
  
  // Add X-Tenant-ID header if tenant ID is available
  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }
  
  const res = await fetch(urlObj.toString(), {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Important for session cookies
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, meta }) => {
    // Check if this query explicitly requires tenant ID
    const requiresTenant = meta?.requiresTenant === true;
    try {
      // Handle array-based path parameters
      let url = '';
      if (Array.isArray(queryKey)) {
        // Special case for teams and projects - the second parameter is a tenant ID that should be a query param, not path param
        if ((queryKey[0] === '/api/teams' || queryKey[0] === '/api/projects') && queryKey.length === 2 && !queryKey[1].includes('users') && !queryKey[1].includes('objectives')) {
          // When the query is ['/api/teams', tenantId] or ['/api/projects', tenantId], we want to use '/api/teams' or '/api/projects' not '/api/teams/tenantId'
          url = queryKey[0];
        }
        // For team details or nested routes like teams with objectives or users
        else if (queryKey[0] === '/api/teams' && queryKey.length >= 2) {
          if (queryKey.length === 3) {
            if (queryKey[2] === 'objectives') {
              url = `/api/teams/${queryKey[1]}/objectives`;
            } 
            else if (queryKey[2] === 'users') {
              url = `/api/teams/${queryKey[1]}/users`;
            }
            else {
              url = `/api/teams/${queryKey[1]}/${queryKey[2]}`;
            }
          } else {
            // For single team details: ['/api/teams', teamId]
            url = `/api/teams/${queryKey[1]}`;
          }
        }
        // For other nested routes (my-objectives, timeframes)
        else {
          url = queryKey[0] as string;
          
          // Handle nested routes with variable path parameters
          for (let i = 1; i < queryKey.length; i++) {
            url += `/${queryKey[i]}`;
          }
        }
      } else {
        // Simple string query key
        url = queryKey as string;
      }
      
      // Get tenant ID from URL
      const tenantId = getCurrentTenantFromUrl();
      const urlObj = new URL(url, window.location.origin);
      
      // Add tenant ID as a query parameter to ensure it's available to the server
      if (tenantId && (requiresTenant || !urlObj.searchParams.has('tenantId'))) {
        // Always add for requiresTenant queries or if not already present
        urlObj.searchParams.set('tenantId', tenantId);
      }
      
      // Prepare headers with tenant ID
      const headers: HeadersInit = {};
      
      // Add X-Tenant-ID header if tenant ID is available
      if (tenantId) {
        headers['X-Tenant-ID'] = tenantId;
      }
      
      const res = await fetch(urlObj.toString(), {
        credentials: "include", // Important for session cookies
        headers
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // If we get a 401 with the returnNull option, return null instead of throwing
      if (
        error instanceof Error &&
        error.message.startsWith("401:") &&
        unauthorizedBehavior === "returnNull"
      ) {
        console.log(`Converted 401 error to null return value (${queryKey[0]})`);
        return null;
      }
      console.error(`Error in getQueryFn for ${queryKey[0]}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false, // Disable auto-refresh for faster performance
      refetchOnWindowFocus: true, // Enable refetch on window focus for fresh data
      refetchOnMount: true, // Always refetch on mount to ensure fresh data
      refetchOnReconnect: true, // Refetch on network reconnect
      staleTime: 1 * 60 * 1000, // 1 minute cache - shorter for better responsiveness
      gcTime: 5 * 60 * 1000, // 5 minutes memory cache
      retry: 1, // Reduce retries for faster failure detection
      retryDelay: 300, // Quick retry for speed
    },
    mutations: {
      retry: 1, // Quick fail for mutations
      retryDelay: 300, // Fast retry
    },
  },
});
