import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import TenantOnboardingWizard from "../components/tenant/tenant-onboarding-wizard"

export default function TenantOnboardingDemoPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-primary text-2xl">Organization Setup Wizard Demo</CardTitle>
          <CardDescription>
            This is a standalone demo of the organization setup wizard that shows the complete
            user flow without requiring authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TenantOnboardingWizard />
        </CardContent>
      </Card>
    </div>
  )
}