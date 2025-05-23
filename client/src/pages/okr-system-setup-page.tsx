import { useParams } from "wouter";
import { useEffect } from "react";
import { useTenantContext } from "@/hooks/use-tenant-context";
import OKRSystemSetupWizard from "@/components/okr-setup/okr-system-setup-wizard";

export default function OKRSystemSetupPage() {
  // Get the tenant ID from URL parameters
  const { tenantId } = useParams<{ tenantId?: string }>();
  const { setCurrentTenantById } = useTenantContext();

  // Set the current tenant context if we have a tenant ID in the URL
  useEffect(() => {
    if (tenantId) {
      // Set the current tenant in context based on the ID from URL
      setCurrentTenantById(tenantId);
    }
  }, [tenantId, setCurrentTenantById]);

  return (
    <div className="container mx-auto px-4 py-8">
      <OKRSystemSetupWizard />
    </div>
  );
}