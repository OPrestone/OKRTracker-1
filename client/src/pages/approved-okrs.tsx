import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Check, Filter, MoreHorizontal, Plus, Search, CheckSquare, XSquare } from 'lucide-react';
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/layouts/dashboard-layout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Types
interface ObjectiveWithKeyResults {
  id: string;
  title: string;
  description?: string;
  level: string;
  status: string;
  progress: number;
  keyResults: KeyResult[];
  teamId?: string;
  ownerId?: string;
  timeframeId?: string;
  parentId?: string;
  isApproved: boolean;
}

interface KeyResult {
  id: string;
  title: string;
  description?: string;
  target_value: string;
  current_value: string;
  start_value: string;
  progress: number;
  status: string;
  objective_id: string;
}

const ApprovedOKRs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const isAdmin = user?.isAdmin || user?.role === 'owner';

  // Fetch approved objectives with current tenant ID
  const { data: approvedObjectives = [], isLoading, error } = useQuery<ObjectiveWithKeyResults[]>({
    queryKey: ['/api/objectives/approved'],
    enabled: !!user,
    queryFn: async ({ queryKey }) => {
      // Try to get tenant ID from session storage, default to user's default tenant if not found
      let tenantId = sessionStorage.getItem('currentTenantId');
      
      // If tenant ID is not found in session storage, check if user has a default tenant
      if (!tenantId && user?.defaultTenant && user.tenants && user.tenants.length > 0) {
        // Find the default tenant in the user's tenant list
        const defaultTenant = user.tenants.find(tenant => tenant.id === user.defaultTenant);
        if (defaultTenant) {
          tenantId = defaultTenant.id;
          console.log('Using default tenant ID from user:', tenantId);
        }
      }
      
      if (!tenantId) {
        console.error('No tenant ID found in session storage or user defaults');
        throw new Error('No tenant ID available. Please select a tenant first.');
      }
      
      const response = await apiRequest('GET', `${queryKey[0]}?tenantId=${tenantId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch approved objectives');
      }
      return response.json();
    },
  });

  // Mutation for unapproving an objective
  const unapproveObjectiveMutation = useMutation({
    mutationFn: async (objectiveId: string) => {
      // Try to get tenant ID from session storage, default to user's default tenant if not found
      let tenantId = sessionStorage.getItem('currentTenantId');
      
      // If tenant ID is not found in session storage, check if user has a default tenant
      if (!tenantId && user?.defaultTenant && user.tenants && user.tenants.length > 0) {
        // Find the default tenant in the user's tenant list
        const defaultTenant = user.tenants.find(tenant => tenant.id === user.defaultTenant);
        if (defaultTenant) {
          tenantId = defaultTenant.id;
          console.log('Using default tenant ID from user for unapprove:', tenantId);
        }
      }
      
      if (!tenantId) {
        console.error('No tenant ID found in session storage or user defaults for unapprove action');
        throw new Error('No tenant ID available. Please select a tenant first.');
      }
      
      const response = await apiRequest('POST', `/api/objectives/${objectiveId}/unapprove?tenantId=${tenantId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unapprove objective');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Objective unapproved',
        description: 'The objective has been successfully unapproved',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/objectives/approved'] });
      queryClient.invalidateQueries({ queryKey: ['/api/objectives'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Filter objectives based on search query
  const filteredObjectives = approvedObjectives.filter(obj => {
    const searchLower = searchQuery.toLowerCase();
    return (
      obj.title.toLowerCase().includes(searchLower) ||
      (obj.description?.toLowerCase().includes(searchLower) || false)
    );
  });

  // Format the status string for display
  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get status badge color class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'on_track':
        return 'bg-blue-100 text-blue-800';
      case 'at_risk':
        return 'bg-amber-100 text-amber-800';
      case 'behind':
        return 'bg-red-100 text-red-800';
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get level badge color class
  const getLevelClass = (level: string) => {
    switch (level) {
      case 'company':
        return 'bg-purple-100 text-purple-800';
      case 'department':
        return 'bg-indigo-100 text-indigo-800';
      case 'team':
        return 'bg-cyan-100 text-cyan-800';
      case 'individual':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle unapprove button click
  const handleUnapprove = (objectiveId: string) => {
    if (confirm('Are you sure you want to unapprove this objective?')) {
      unapproveObjectiveMutation.mutate(objectiveId);
    }
  };

  // DataTable columns
  const columns = [
    {
      header: 'Title',
      accessorKey: 'title',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.title}</div>
          {row.original.description && (
            <div className="text-sm text-muted-foreground line-clamp-2">{row.original.description}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Level',
      accessorKey: 'level',
      cell: ({ row }: any) => (
        <Badge className={getLevelClass(row.original.level)}>
          {row.original.level.charAt(0).toUpperCase() + row.original.level.slice(1)}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }: any) => (
        <Badge className={getStatusClass(row.original.status)}>
          {formatStatus(row.original.status)}
        </Badge>
      ),
    },
    {
      header: 'Progress',
      accessorKey: 'progress',
      cell: ({ row }: any) => (
        <div className="w-full">
          <div className="flex justify-between mb-1">
            <span className="text-xs font-medium">{row.original.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                row.original.progress >= 70 ? 'bg-green-500' : 
                row.original.progress >= 40 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${row.original.progress}%` }}
            ></div>
          </div>
        </div>
      ),
    },
    {
      header: 'Key Results',
      accessorKey: 'keyResults',
      cell: ({ row }: any) => (
        <span className="text-sm">
          {row.original.keyResults?.length || 0} KRs
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/objectives/${row.original.id}`)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          
          {isAdmin && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleUnapprove(row.original.id)}
                    className="text-red-600"
                  >
                    <XSquare className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Unapprove objective</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Approved OKRs">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approved OKRs</h1>
          <p className="text-gray-600">View all approved objectives across the organization</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search objectives..."
            className="pl-8 w-[200px] lg:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Card className="shadow-sm border-gray-200 p-6">
        <Tabs
          defaultValue="all"
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="mb-6"
        >
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="department">Department</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <>
                {filteredObjectives.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckSquare className="h-12 w-12 text-gray-400 mb-4 mx-auto" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No approved OKRs</h3>
                    <p className="text-gray-500 mb-4">There are no approved objectives available.</p>
                  </div>
                ) : (
                  <DataTable
                    columns={columns}
                    data={filteredObjectives}
                  />
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="company">
            <DataTable
              columns={columns}
              data={filteredObjectives.filter(obj => obj.level === 'company')}
            />
          </TabsContent>
          
          <TabsContent value="department">
            <DataTable
              columns={columns}
              data={filteredObjectives.filter(obj => obj.level === 'department')}
            />
          </TabsContent>
          
          <TabsContent value="team">
            <DataTable
              columns={columns}
              data={filteredObjectives.filter(obj => obj.level === 'team')}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </DashboardLayout>
  );
};

export default ApprovedOKRs;