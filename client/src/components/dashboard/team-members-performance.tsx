import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ChevronDown, 
  Search, 
  Loader2,
  BarChart2, 
  ListFilter 
} from 'lucide-react';
import { getQueryFn } from '@/lib/queryClient';
import { useTenantContext } from '@/hooks/use-tenant-context';
import MemberPerformance from './member-performance';

interface TeamMembersPerformanceProps {
  teamId: string;
}

const TeamMembersPerformance = ({ teamId }: TeamMembersPerformanceProps) => {
  const { currentTenant } = useTenantContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  
  const tenantId = currentTenant?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/teams/${teamId}/members-performance`, tenantId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!teamId && !!tenantId,
  });

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Filter members based on search query
  const filteredMembers = data ? data.filter((member: any) => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  // Handle member selection
  const handleMemberSelection = (memberId: string) => {
    setSelectedMember(memberId);
    setSelectedTab('detail');
  };

  if (isLoading) {
    return (
      <Card className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="min-h-[400px]">
        <CardHeader>
          <CardTitle>Team Members Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load team members performance data. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="min-h-[400px]">
        <CardHeader>
          <CardTitle>Team Members Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Data</AlertTitle>
            <AlertDescription>
              No performance data available for members of this team.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-h-[400px]">
      <CardHeader>
        <CardTitle>Team Members Performance</CardTitle>
        <CardDescription>
          Performance metrics for individual team members
        </CardDescription>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="detail" disabled={!selectedMember}>
                Member Detail
              </TabsTrigger>
            </TabsList>
            
            {selectedTab === 'overview' && (
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    className="pl-8 max-w-xs"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ListFilter className="h-4 w-4 mr-1" />
                      Sort
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {}}>
                      Name (A-Z)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {}}>
                      Progress (High-Low)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {}}>
                      Objectives (High-Low)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          
          <TabsContent value="overview" className="mt-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Objectives</TableHead>
                    <TableHead>Key Results</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member: any) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={member.progress} className="h-2 w-[60px]" />
                          <span className="text-sm">{member.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{member.objectives.total} total</span>
                          <div className="text-xs text-muted-foreground flex space-x-2">
                            <span className="text-green-500">{member.objectives.completed} completed</span>
                            <span>•</span>
                            <span className="text-red-500">{member.objectives.behind} behind</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{member.keyResults.total} total</span>
                          <span className="text-xs text-green-500">{member.keyResults.completed} completed</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.progress >= 70 ? (
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-xs text-green-500">On Track</span>
                          </div>
                        ) : member.progress >= 40 ? (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-xs text-yellow-500">At Risk</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-xs text-red-500">Behind</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMemberSelection(member.id)}
                        >
                          <BarChart2 className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="detail" className="mt-4">
            {selectedMember && (
              <MemberPerformance teamId={teamId} userId={selectedMember} />
            )}
          </TabsContent>
        </Tabs>
      </CardHeader>
    </Card>
  );
};

export default TeamMembersPerformance;