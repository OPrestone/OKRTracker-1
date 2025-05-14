import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useTenantContext } from '@/hooks/use-tenant-context';
import Dashboard from '@/pages/dashboard';

/**
 * Component that renders the dashboard when a user visits a tenant root URL (/{tenantId})
 * This ensures users who visit a tenant directly see the dashboard view
 */
export default function TenantDashboardRedirect() {
  const { id } = useParams<{ id: string }>();
  const { setCurrentTenantById, isLoading } = useTenantContext();
  const [tenantLoaded, setTenantLoaded] = useState(false);

  useEffect(() => {
    if (!isLoading && id) {
      // Set the current tenant in context based on the ID
      setCurrentTenantById(id);
      setTenantLoaded(true);
    }
  }, [id, isLoading, setCurrentTenantById]);

  // Show loading state while setting tenant context
  if (isLoading || !tenantLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  // Once tenant is loaded, render the dashboard directly
  return <Dashboard />;
}