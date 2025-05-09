import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Function to get the current tenant ID from the URL
function getCurrentTenantFromUrl(): number | null {
  // Check for numeric tenant ID in /tenants/{id} pattern
  const numericMatch = window.location.pathname.match(/\/tenants\/(\d+)/);
  if (numericMatch) {
    return parseInt(numericMatch[1]);
  }
  
  // For organization slug routes, we need to rely on session storage
  // This will be set when switching tenants in the TenantProvider
  const storedTenantId = sessionStorage.getItem('currentTenantId');
  return storedTenantId ? parseInt(storedTenantId) : null;
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
  // Add tenant query parameter if available
  const tenantId = getCurrentTenantFromUrl();
  const urlObj = new URL(url, window.location.origin);
  
  // Only add tenantId if it exists
  if (tenantId) {
    urlObj.searchParams.append('tenantId', tenantId.toString());
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
      // Add tenant query parameter if available
      const tenantId = getCurrentTenantFromUrl();
      const urlKey = queryKey[0] as string;
      const urlObj = new URL(urlKey, window.location.origin);
      
      // Only add tenantId if it exists and not already in the URL
      if (tenantId && !urlObj.searchParams.has('tenantId')) {
        urlObj.searchParams.append('tenantId', tenantId.toString());
      }
      
      const res = await fetch(urlObj.toString(), {
        credentials: "include", // Important for session cookies
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      return data;
    } catch (error) {
      // If we get a 401 with the returnNull option, return null instead of throwing
      if (
        error instanceof Error &&
        error.message.startsWith("401:") &&
        unauthorizedBehavior === "returnNull"
      ) {
        return null;
      }
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
