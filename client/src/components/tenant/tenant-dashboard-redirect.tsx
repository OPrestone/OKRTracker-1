import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { Loader2, Building, ArrowRight } from 'lucide-react';
import { useTenantContext } from '@/hooks/use-tenant-context';
import Dashboard from '@/pages/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Component that renders the dashboard when a user visits a tenant root URL (/{tenantId})
 * This ensures users who visit a tenant directly see the dashboard view
 */
export default function TenantDashboardRedirect() {
  const { id } = useParams<{ id: string }>();
  const { setCurrentTenantById, isLoading, currentTenant } = useTenantContext();
  const [tenantLoaded, setTenantLoaded] = useState(false);
  const [showTenantInfo, setShowTenantInfo] = useState(true);

  useEffect(() => {
    if (!isLoading && id) {
      // Set the current tenant in context based on the ID
      setCurrentTenantById(id);
      setTenantLoaded(true);
      
      // Auto-hide the tenant info banner after 5 seconds
      const timer = setTimeout(() => {
        setShowTenantInfo(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [id, isLoading, setCurrentTenantById]);

  // Show loading state while setting tenant context
  if (isLoading || !tenantLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading organization dashboard...</p>
      </div>
    );
  }
  
  return (
    <>
      {showTenantInfo && currentTenant && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-xl">
          <Card className="bg-white border-primary/20 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Building className="h-5 w-5 text-primary mr-2" />
                Organization Selected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-lg">{currentTenant.displayName || currentTenant.name}</p>
                  <p className="text-sm text-muted-foreground">ID: {currentTenant.id}</p>
                </div>
                <div className="flex items-center text-sm text-primary">
                  <span>Viewing tenant-specific data</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Once tenant is loaded, render the dashboard directly */}
      <Dashboard />
    </>
  );
}