import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import ApprovedOkrsList from '@/components/dashboard/approved-okrs-list';

const ApprovedTenantOKRsPage = () => {
  const params = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedTab, setSelectedTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Use the tenant ID from URL parameters or default to the specific tenant ID
  const tenantId = params.tenantId || '01JW2KF5Z11KG9M1VE4N2MG6FA';
  
  useEffect(() => {
    // Check authentication status when component mounts
    if (!authLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please login to view approved OKRs",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    
    // Simulate checking tenant access
    if (!authLoading && user) {
      const userTenants = (user as any).tenants || [];
      const hasTenantAccess = userTenants.some((t: any) => t.id === tenantId);
      
      if (!hasTenantAccess) {
        setError(`You don't have access to this organization's OKRs`);
      }
      
      setIsLoading(false);
    }
  }, [user, authLoading, tenantId, navigate, toast]);

  if (authLoading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-full max-w-md">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error) {
    return (
      <DashboardLayout title="Access Error">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <CardTitle className="text-red-700">Access Denied</CardTitle>
              </div>
              <CardDescription className="text-red-600">
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

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