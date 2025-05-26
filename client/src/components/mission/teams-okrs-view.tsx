import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronRight, 
  ChevronDown, 
  CheckCircle, 
  Circle, 
  Users, 
  User, 
  Search,
  Filter,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface OKRItem {
  id: string;
  title: string;
  team: string[];
  owner: {
    name: string;
    initials: string;
  };
  progress: number;
  status: 'on-track' | 'at-risk' | 'behind';
  isExpanded: boolean;
  children?: OKRItem[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'on-track':
      return 'text-green-500 bg-green-50';
    case 'at-risk':
      return 'text-yellow-500 bg-yellow-50';
    case 'behind':
      return 'text-red-500 bg-red-50';
    default:
      return 'text-gray-500 bg-gray-50';
  }
};

// Custom Progress component that accepts color
function CustomProgress({ value, color }: { value: number; color: string }) {
  return (
    <Progress 
      value={value} 
      className="h-2"
      style={{ 
        '--progress-color': color
      } as React.CSSProperties}
    />
  );
};

export function TeamsOkrsView() {
  const [activeTab, setActiveTab] = useState<'okrs' | 'check-ins' | 'dashboard'>('okrs');
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Fetch teams data
  const { data: teams = [], isLoading: teamsLoading, error: teamsError } = useQuery({
    queryKey: ['/api/teams'],
  });

  // Fetch objectives data
  const { data: objectives = [], isLoading: objectivesLoading, error: objectivesError } = useQuery({
    queryKey: ['/api/objectives'],
  });

  // Fetch key results data
  const { data: keyResults = [], isLoading: keyResultsLoading, error: keyResultsError } = useQuery({
    queryKey: ['/api/key-results'],
  });

  // Fetch users data for owner information
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['/api/users'],
  });

  const isLoading = teamsLoading || objectivesLoading || keyResultsLoading || usersLoading;
  const hasError = teamsError || objectivesError || keyResultsError || usersError;

  // Transform database data into OKR format
  const transformedOkrs: OKRItem[] = React.useMemo(() => {
    if (!Array.isArray(objectives) || !Array.isArray(teams) || !Array.isArray(users)) return [];
    if (!objectives.length) return [];

    return objectives.map((objective: any) => {
      // Ensure objective has required properties
      if (!objective || !objective.id || !objective.title) return null;

      // Find the owner user
      const ownerUser = users.find((user: any) => user && user.id === objective.ownerId);
      const firstName = ownerUser?.firstName || '';
      const lastName = ownerUser?.lastName || '';
      const username = ownerUser?.username || '';
      
      const ownerName = firstName && lastName ? 
        `${firstName} ${lastName}`.trim() : 
        username || 'Unknown';
      
      const ownerInitials = firstName && lastName ? 
        `${firstName[0]}${lastName[0]}`.toUpperCase() : 
        (username ? username[0].toUpperCase() : 'U');

      // Find the team
      const team = teams.find((team: any) => team && team.id === objective.teamId);
      const teamNames = team?.name ? [team.name] : ['Unknown Team'];

      // Calculate progress from key results
      const objectiveKeyResults = Array.isArray(keyResults) ? 
        keyResults.filter((kr: any) => kr && kr.objectiveId === objective.id) : [];
      const averageProgress = objectiveKeyResults.length > 0 ? 
        Math.round(objectiveKeyResults.reduce((sum: number, kr: any) => sum + (kr.progress || 0), 0) / objectiveKeyResults.length) : 0;

      // Determine status based on progress
      const status = averageProgress >= 70 ? 'on-track' : averageProgress >= 40 ? 'at-risk' : 'behind';

      // Transform key results into children
      const children: OKRItem[] = objectiveKeyResults.map((kr: any) => {
        if (!kr || !kr.id || !kr.title) return null;

        const krOwnerUser = users.find((user: any) => user && user.id === kr.assignedToId);
        const krFirstName = krOwnerUser?.firstName || '';
        const krLastName = krOwnerUser?.lastName || '';
        const krUsername = krOwnerUser?.username || '';
        
        const krOwnerName = krFirstName && krLastName ? 
          `${krFirstName} ${krLastName}`.trim() : 
          krUsername || 'Unknown';
        
        const krOwnerInitials = krFirstName && krLastName ? 
          `${krFirstName[0]}${krLastName[0]}`.toUpperCase() : 
          (krUsername ? krUsername[0].toUpperCase() : 'U');

        const krProgress = kr.progress || 0;
        const krStatus = krProgress >= 70 ? 'on-track' : krProgress >= 40 ? 'at-risk' : 'behind';

        return {
          id: kr.id,
          title: kr.title,
          team: teamNames,
          owner: {
            name: krOwnerName,
            initials: krOwnerInitials
          },
          progress: krProgress,
          status: krStatus,
          isExpanded: expandedItems.has(kr.id)
        };
      }).filter(Boolean);

      return {
        id: objective.id,
        title: objective.title,
        team: teamNames,
        owner: {
          name: ownerName,
          initials: ownerInitials
        },
        progress: averageProgress,
        status: status,
        isExpanded: expandedItems.has(objective.id),
        children: children.length > 0 ? children : undefined
      };
    }).filter(Boolean);
  }, [objectives, teams, users, keyResults, expandedItems]);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredOkrs = transformedOkrs.filter(okr => {
    const matchesQuery = okr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      okr.owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      okr.team.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const childrenMatch = okr.children?.some(child => 
      child.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      child.owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      child.team.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    return matchesQuery || childrenMatch;
  });

  const renderOkrItem = (okr: OKRItem, isChild: boolean = false) => (
    <div key={okr.id} className={`border-b last:border-b-0 py-3 ${isChild ? 'pl-8' : ''}`}>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => toggleExpand(okr.id)} 
          className="text-gray-500 hover:text-gray-700"
        >
          {okr.children && okr.children.length > 0 ? (
            okr.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </button>
        
        <div className="flex-1 grid grid-cols-12 gap-2 items-center">
          <div className="col-span-5">
            <p className={`text-sm font-medium ${isChild ? '' : 'text-blue-600'}`}>{okr.title}</p>
          </div>
          
          <div className="col-span-2 flex items-center space-x-1">
            {okr.team.map((team, idx) => (
              <div key={idx} className="flex items-center text-xs text-gray-500">
                {idx === 0 ? <Users className="h-3 w-3 mr-1" /> : null}
                <span>{team}</span>
                {idx < okr.team.length - 1 ? ", " : ""}
              </div>
            ))}
          </div>
          
          <div className="col-span-2 flex items-center text-xs text-gray-500">
            <div className="bg-gray-200 rounded-full h-5 w-5 flex items-center justify-center mr-1 text-[10px]">
              {okr.owner.initials}
            </div>
            {okr.owner.name}
          </div>
          
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Progress value={okr.progress} className="h-2" />
              </div>
              <span className="text-xs font-medium">{okr.progress}%</span>
            </div>
          </div>
          
          <div className="col-span-1">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(okr.status)}`}>
              {okr.status === 'on-track' ? 'On track' : okr.status === 'at-risk' ? 'At risk' : 'Behind'}
            </span>
          </div>
        </div>
      </div>
      
      {okr.isExpanded && okr.children && (
        <div className="mt-2">
          {okr.children.map(child => renderOkrItem(child, true))}
        </div>
      )}
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <Card className="border-t-4 border-t-indigo-600">
        <CardHeader>
          <CardTitle>Teams OKRs</CardTitle>
          <CardDescription>Track team objectives and key results progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading Teams OKRs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (hasError) {
    return (
      <Card className="border-t-4 border-t-indigo-600">
        <CardHeader>
          <CardTitle>Teams OKRs</CardTitle>
          <CardDescription>Track team objectives and key results progress</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error loading Teams OKRs</AlertTitle>
            <AlertDescription>
              There was a problem fetching team objectives data. Please try refreshing the page or contact support if the issue persists.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-t-4 border-t-indigo-600">
      <CardHeader>
        <CardTitle>Teams OKRs</CardTitle>
        <CardDescription>Track team objectives and key results progress</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="okrs" value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="okrs" className="px-6">OKRs</TabsTrigger>
            <TabsTrigger value="check-ins" className="px-6">Check-ins</TabsTrigger>
            <TabsTrigger value="dashboard" className="px-6">Dashboard</TabsTrigger>
          </TabsList>
          
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium">
              Cascade
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search..." 
                  className="pl-8 h-9 w-60" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
            </div>
          </div>
          
          <TabsContent value="okrs" className="m-0">
            <div className="border rounded-md">
              <div className="bg-gray-50 border-b py-2 px-4">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500">
                  <div className="col-span-5">Name</div>
                  <div className="col-span-2">Team</div>
                  <div className="col-span-2">Owner</div>
                  <div className="col-span-2">Progress</div>
                  <div className="col-span-1">Status</div>
                </div>
              </div>
              
              <div className="px-4">
                {filteredOkrs.length > 0 ? (
                  filteredOkrs.map(okr => renderOkrItem(okr))
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    {searchQuery ? "No OKRs match your search criteria" : "No team objectives found. Create your first objective to get started."}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="check-ins" className="m-0">
            <div className="border rounded-md p-8 text-center">
              <h3 className="font-medium text-lg mb-2">Check-ins Coming Soon</h3>
              <p className="text-gray-500">This feature will allow you to view team check-ins and progress updates.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="dashboard" className="m-0">
            <div className="border rounded-md p-8 text-center">
              <h3 className="font-medium text-lg mb-2">Strategy Dashboard Coming Soon</h3>
              <p className="text-gray-500">The dashboard will show strategy map and visualizations of team performance.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}