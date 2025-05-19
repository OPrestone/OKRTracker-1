import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Function to get the current tenant ID from the URL
function getCurrentTenantFromUrl(): string | null {
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
    
    // Enhanced debugging for authentication and API errors
    if (res.status === 401) {
      console.error(`Authentication error: ${res.status} for ${res.url}`);
      console.error('Authentication Context: ', {
        cookies: document.cookie ? 'Present' : 'None',
        url: res.url,
        timestamp: new Date().toISOString()
      });
      
      // Try to check session status to debug authentication issues
      try {
        const sessionCheck = await fetch('/api/test-session', { 
          credentials: 'include'
        });
        if (sessionCheck.ok) {
          const sessionData = await sessionCheck.json();
          console.log('Session status:', sessionData);
        } else {
          console.log('Session check failed:', sessionCheck.status);
        }
      } catch (sessionError) {
        console.error('Error checking session:', sessionError);
      }
    } else if (res.status === 403) {
      console.error(`Permission error: ${res.status} for ${res.url}`);
    } else {
      console.error(`API error: ${res.status} for ${res.url} - ${text}`);
    }
    
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Add tenant query parameter if available
  const tenantId = getCurrentTenantFromUrl();
  const urlObj = new URL(url, window.location.origin);
  
  // Only add tenantId if it exists
  if (tenantId) {
    urlObj.searchParams.append('tenantId', tenantId);
  }
  
  const res = await fetch(urlObj.toString(), {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
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
  async ({ queryKey }) => {
    try {
      // Enhanced debugging: log the request attempt
      console.log(`Making API request with queryKey:`, queryKey);
      
      // Handle array-based path parameters
      let url = '';
      if (Array.isArray(queryKey)) {
        // Special case for teams - the second parameter is a tenant ID that should be a query param, not path param
        if (queryKey[0] === '/api/teams' && queryKey.length === 2 && !queryKey[1].includes('users') && !queryKey[1].includes('objectives')) {
          // When the query is ['/api/teams', tenantId], we want to use '/api/teams' not '/api/teams/tenantId'
          url = queryKey[0];
          console.log(`Teams list URL constructed: ${url}`);
        }
        // For team details or nested routes like teams with objectives or users
        else if (queryKey[0] === '/api/teams' && queryKey.length >= 2) {
          if (queryKey.length === 3) {
            if (queryKey[2] === 'objectives') {
              url = `/api/teams/${queryKey[1]}/objectives`;
              console.log(`Constructed team objectives URL: ${url}`);
            } 
            else if (queryKey[2] === 'users') {
              url = `/api/teams/${queryKey[1]}/users`;
              console.log(`Constructed team users URL: ${url}`);
            }
            else {
              url = `/api/teams/${queryKey[1]}/${queryKey[2]}`;
              console.log(`Constructed nested team URL: ${url}`);
            }
          } else {
            // For single team details: ['/api/teams', teamId]
            url = `/api/teams/${queryKey[1]}`;
            console.log(`Constructed team details URL: ${url}`);
          }
        }
        // For other nested routes (my-objectives, timeframes)
        else {
          url = queryKey[0] as string;
          
          // Handle nested routes with variable path parameters
          for (let i = 1; i < queryKey.length; i++) {
            url += `/${queryKey[i]}`;
          }
          
          console.log(`Constructed URL from array path: ${url}`);
        }
      } else {
        // Simple string query key
        url = queryKey as string;
      }
      
      // Add tenant query parameter if available
      const tenantId = getCurrentTenantFromUrl();
      const urlObj = new URL(url, window.location.origin);
      
      // Only add tenantId if it exists and not already in the URL
      if (tenantId && !urlObj.searchParams.has('tenantId')) {
        urlObj.searchParams.append('tenantId', tenantId);
      }
      
      // Show request context for debugging
      const requestUrl = urlObj.toString();
      console.log('Request context:', { 
        url: requestUrl,
        hasCredentials: true,
        hasTenant: !!tenantId
      });
      
      const res = await fetch(requestUrl, {
        credentials: "include", // Important for session cookies
        headers: {
          // Adding a client timestamp for debugging
          'X-Client-Timestamp': new Date().toISOString()
        }
      });

      // Capture response status for better debugging
      console.log(`Response received: ${res.status} for ${requestUrl}`);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`Handling 401 with returnNull for ${requestUrl}`);
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      
      // Log successful data retrieval (without exposing sensitive data)
      if (data) {
        console.log(`Data successfully retrieved from ${requestUrl}`);
      }
      
      return data;
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
      refetchInterval: false,
      refetchOnWindowFocus: true, // Enable to handle session expiration
      staleTime: 60000, // 1 minute stale time instead of Infinity
      retry: 1, // Allow one retry
      refetchOnMount: true, // Refetch on component mount
    },
    mutations: {
      retry: 1, // Allow one retry for mutations
    },
  },
});
