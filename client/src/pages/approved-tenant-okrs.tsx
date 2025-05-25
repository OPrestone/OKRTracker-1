import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ApprovedOkrsList from '@/components/dashboard/approved-okrs-list';

const ApprovedTenantOKRsPage = () => {
  const params = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedTab, setSelectedTab] = useState('all');
  const tenantId = params.tenantId || '01JW2KF5Z11KG9M1VE4N2MG6FA'; // Default to the specific tenant ID requested

  return (
    <DashboardLayout title="Approved OKRs">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Approved OKRs for this Organization</h1>
        <p className="text-muted-foreground">View all approved objectives across the organization</p>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-0">
          <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="all">All Levels</TabsTrigger>
              <TabsTrigger value="company">Company</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-6">
          <TabsContent value="all" className="mt-0">
            <ApprovedOkrsList tenantId={tenantId} />
          </TabsContent>
          <TabsContent value="company" className="mt-0">
            {/* We'd filter by company level in a real implementation */}
            <Card>
              <CardHeader>
                <CardTitle>Company OKRs</CardTitle>
                <CardDescription>Company-level objectives and key results</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This would show only company-level OKRs from the approved list.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="team" className="mt-0">
            {/* We'd filter by team level in a real implementation */}
            <Card>
              <CardHeader>
                <CardTitle>Team OKRs</CardTitle>
                <CardDescription>Team-level objectives and key results</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This would show only team-level OKRs from the approved list.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ApprovedTenantOKRsPage;