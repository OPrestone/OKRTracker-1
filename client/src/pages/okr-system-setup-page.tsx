import { useParams } from "wouter";
import { useEffect } from "react";
import { useTenantContext } from "@/hooks/use-tenant-context";
import OKRSystemSetupWizard from "@/components/okr-setup/okr-system-setup-wizard";
import { Rocket, Lightbulb, Target, CheckCircle } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">OKR System Setup</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Configure your organization's OKR system to align with your strategic goals and team structure. 
              This setup will establish the foundation for all your objective tracking.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-blue-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <Lightbulb className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Define Mission</h3>
              <p className="text-sm text-gray-500">Set your company's core purpose and vision</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border border-blue-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Timeframes</h3>
              <p className="text-sm text-gray-500">Create planning periods for your objectives</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border border-blue-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Team Structure</h3>
              <p className="text-sm text-gray-500">Configure which teams participate in OKRs</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border border-blue-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <Rocket className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Go Live</h3>
              <p className="text-sm text-gray-500">Launch your configured OKR system</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md border border-gray-100">
          <OKRSystemSetupWizard />
        </div>
      </div>
    </div>
  );
}