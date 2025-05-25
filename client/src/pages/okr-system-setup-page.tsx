import { useParams } from "wouter";
import { useEffect, useState } from "react";
import { useTenantContext } from "@/hooks/use-tenant-context";
import OKRSystemSetupWizard from "@/components/okr-setup/okr-system-setup-wizard";
import RedesignedOKRSystemWizard from "@/components/okr-setup/redesigned-wizard";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function OKRSystemSetupPage() {
  // Get the tenant ID from URL parameters
  const { tenantId } = useParams<{ tenantId?: string }>();
  const { setCurrentTenantById } = useTenantContext();
  const [useRedesignedUI, setUseRedesignedUI] = useState(true);

  // Set the current tenant context if we have a tenant ID in the URL
  useEffect(() => {
    if (tenantId) {
      // Set the current tenant in context based on the ID from URL
      setCurrentTenantById(tenantId);
    }
  }, [tenantId, setCurrentTenantById]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="use-redesigned-ui"
            checked={useRedesignedUI}
            onCheckedChange={setUseRedesignedUI}
          />
          <Label htmlFor="use-redesigned-ui" className="text-sm text-gray-600">Use redesigned UI</Label>
        </div>
      </div>
      
      {useRedesignedUI ? (
        <RedesignedOKRSystemWizard />
      ) : (
        <OKRSystemSetupWizard />
      )}
    </div>
  );
}