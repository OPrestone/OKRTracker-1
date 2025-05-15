import { useState, useEffect } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DiagnosticResult {
  auth: {
    isAuthenticated: boolean;
    sessionID: string;
    userId: string;
  };
  tenant: {
    requestedTenantId: string;
    tenantsForUser: Array<{ id: string; name: string }>;
  };
  projects: {
    count: number;
    error: string | null;
  };
  timestamp: string;
}

export default function ProjectDiagnostics() {
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentTenant } = useTenantContext();
  const { user } = useAuth();
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Construct URL with query parameters
      let url = '/api/project-diagnostics';
      if (currentTenant?.id) {
        url += `?tenantId=${currentTenant.id}`;
      }
      
      // Fetch diagnostic data
      const response = await fetch(url, {
        credentials: 'include' // Important for cookies/session
      });
      
      if (!response.ok) {
        throw new Error(`Diagnostic request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setDiagnosticResults(data);
      
      toast({
        title: "Diagnostics Completed",
        description: "Results have been retrieved successfully",
      });
    } catch (err) {
      console.error("Diagnostic error:", err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      toast({
        title: "Diagnostics Failed",
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Run diagnostics automatically on load
  useEffect(() => {
    if (currentTenant?.id) {
      runDiagnostics();
    }
  }, [currentTenant?.id]);

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Project Kanban Diagnostics</h1>
            <p className="text-neutral-600 mt-1">
              Troubleshooting tools for project kanban board issues
            </p>
          </div>
          <Button 
            onClick={runDiagnostics} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Run Diagnostics
          </Button>
        </div>
        
        {error && (
          <Card className="mb-6 border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-700">Diagnostic Error</h3>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {loading && !diagnosticResults && (
          <div className="flex items-center justify-center h-[400px]">
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-neutral-600">Running diagnostics...</p>
            </div>
          </div>
        )}
        
        {diagnosticResults && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Authentication Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {diagnosticResults.auth.isAuthenticated ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  Authentication Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Authenticated:</span>{' '}
                    <Badge variant={diagnosticResults.auth.isAuthenticated ? "success" : "destructive"}>
                      {diagnosticResults.auth.isAuthenticated ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Session ID:</span>{' '}
                    <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">
                      {diagnosticResults.auth.sessionID}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">User ID:</span>{' '}
                    <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">
                      {diagnosticResults.auth.userId}
                    </span>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div>
                    <span className="font-medium">Current user context:</span>{' '}
                    <div className="mt-1 p-2 bg-gray-50 rounded-md">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(user, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Tenant Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {diagnosticResults.tenant.requestedTenantId ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  Tenant Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Requested Tenant ID:</span>{' '}
                    {diagnosticResults.tenant.requestedTenantId ? (
                      <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">
                        {diagnosticResults.tenant.requestedTenantId}
                      </span>
                    ) : (
                      <Badge variant="destructive">Missing</Badge>
                    )}
                  </div>
                  
                  <div>
                    <span className="font-medium">Available Tenants:</span>{' '}
                    {diagnosticResults.tenant.tenantsForUser.length > 0 ? (
                      <Badge variant="outline">{diagnosticResults.tenant.tenantsForUser.length}</Badge>
                    ) : (
                      <Badge variant="destructive">None Found</Badge>
                    )}
                    
                    <div className="mt-2 space-y-1">
                      {diagnosticResults.tenant.tenantsForUser.map(tenant => (
                        <div 
                          key={tenant.id} 
                          className={`p-2 text-sm rounded-md ${tenant.id === diagnosticResults.tenant.requestedTenantId ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}
                        >
                          <div className="font-medium">{tenant.name}</div>
                          <div className="font-mono text-xs text-gray-500">{tenant.id}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div>
                    <span className="font-medium">Current tenant context:</span>{' '}
                    <div className="mt-1 p-2 bg-gray-50 rounded-md">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(currentTenant, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Projects Status */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {diagnosticResults.projects.error === null ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  Projects Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Project Count:</span>{' '}
                    <Badge variant="outline">{diagnosticResults.projects.count}</Badge>
                  </div>
                  
                  {diagnosticResults.projects.error && (
                    <div>
                      <span className="font-medium text-red-600">Error:</span>{' '}
                      <div className="mt-1 p-3 bg-red-50 text-red-700 rounded-md">
                        {diagnosticResults.projects.error}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium">Recommended Actions:</span>
                    <ul className="mt-2 space-y-1 list-disc pl-5">
                      {!diagnosticResults.auth.isAuthenticated && (
                        <li>
                          You are not authenticated. Try logging in first.
                        </li>
                      )}
                      
                      {diagnosticResults.auth.isAuthenticated && !diagnosticResults.tenant.requestedTenantId && (
                        <li>
                          No tenant ID was provided. Make sure you're accessing the page through the proper tenant URL.
                        </li>
                      )}
                      
                      {diagnosticResults.auth.isAuthenticated && 
                       diagnosticResults.tenant.requestedTenantId && 
                       diagnosticResults.tenant.tenantsForUser.length === 0 && (
                        <li>
                          You don't have access to any tenants. Contact an administrator to give you tenant access.
                        </li>
                      )}
                      
                      {diagnosticResults.auth.isAuthenticated && 
                       diagnosticResults.tenant.requestedTenantId && 
                       !diagnosticResults.tenant.tenantsForUser.some(t => t.id === diagnosticResults.tenant.requestedTenantId) && (
                        <li>
                          You don't have access to the requested tenant. Contact an administrator to give you access.
                        </li>
                      )}
                      
                      {diagnosticResults.projects.error && (
                        <li>
                          Project query failed with an error. Check the server logs for more details.
                        </li>
                      )}
                      
                      {diagnosticResults.auth.isAuthenticated && 
                       diagnosticResults.tenant.requestedTenantId && 
                       diagnosticResults.projects.error === null &&
                       diagnosticResults.projects.count === 0 && (
                        <li>
                          No projects found for this tenant. Try creating a new project.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Raw Response */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Raw Diagnostic Data</CardTitle>
                <CardDescription>
                  Response received at {new Date(diagnosticResults.timestamp).toLocaleTimeString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-xs">
                  {JSON.stringify(diagnosticResults, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}