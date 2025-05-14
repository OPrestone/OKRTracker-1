import { useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useTenantContext } from '@/hooks/use-tenant-context';

/**
 * Component that redirects from a tenant root URL (/{tenantId}) to the dashboard page
 * This ensures users who visit a tenant directly are taken to the dashboard view
 */
export default function TenantDashboardRedirect() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { setCurrentTenantById, isLoading } = useTenantContext();

  useEffect(() => {
    if (!isLoading && id) {
      // Set the current tenant in context based on the ID
      setCurrentTenantById(id);
      
      // Redirect to the dashboard view for this tenant
      navigate(`/${id}/home`, { replace: true });
    }
  }, [id, isLoading, navigate, setCurrentTenantById]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Redirecting to dashboard...</p>
    </div>
  );
}