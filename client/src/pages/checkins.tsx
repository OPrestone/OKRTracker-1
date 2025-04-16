import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  PlusCircle, 
  Calendar, 
  Search, 
  AlertCircle, 
  Filter,
  ArrowUpRight,
  ClipboardList,
  BarChart3,
  ClipboardCheck,
  Goal,
  ListChecks
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { CheckIn, Objective, KeyResult, User } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { UpdateOKRDialog } from '@/components/check-ins/update-okr-dialog';

const CheckinCard = ({ checkin }: { checkin: any }) => {
  const date = new Date(checkin.createdAt);
  
  const formattedDate = formatDistanceToNow(date, { addSuffix: true });
  
  // Get the target type (objective or key result)
  const targetType = checkin.objectiveId ? 'Objective' : 'Key Result';
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-3">
              <AvatarFallback>{checkin.user?.firstName?.[0]}{checkin.user?.lastName?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base font-medium">{checkin.user?.firstName} {checkin.user?.lastName}</CardTitle>
              <CardDescription>{formattedDate}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
            {targetType} Check-in
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Target:</h4>
          <p className="text-gray-900">
            {checkin.objective?.title || checkin.keyResult?.title || 'Unknown'}
          </p>
        </div>
        
        {checkin.notes && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Notes:</h4>
            <p className="text-gray-600 text-sm">{checkin.notes}</p>
          </div>
        )}
        
        {checkin.progress !== undefined && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-sm font-medium text-gray-700">Progress:</h4>
              <span className="text-sm font-medium">{checkin.progress}%</span>
            </div>
            <Progress value={checkin.progress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const CheckinsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('checkins');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateOKRDialogOpen, setIsUpdateOKRDialogOpen] = useState(false);
  
  // State for new check-in form
  const [checkInType, setCheckInType] = useState('objective');
  const [selectedObjectiveId, setSelectedObjectiveId] = useState('');
  const [selectedKeyResultId, setSelectedKeyResultId] = useState('');
  const [progress, setProgress] = useState('0');
  const [notes, setNotes] = useState('');

  // Fetch check-ins
  const { data: checkIns, isLoading: checkInsLoading } = useQuery({
    queryKey: ['/api/check-ins'],
  });

  // Fetch objectives for dropdown
  const { data: objectives } = useQuery<Objective[]>({
    queryKey: ['/api/objectives'],
  });

  // Fetch key results based on selected objective
  const { data: keyResults } = useQuery<KeyResult[]>({
    queryKey: ['/api/objectives', selectedObjectiveId, 'key-results'],
    enabled: !!selectedObjectiveId && checkInType === 'keyResult',
  });

  // Fetch teams
  const { data: teams } = useQuery({
    queryKey: ['/api/teams'],
  });

  // Filter check-ins
  const filteredCheckIns = checkIns?.filter((checkIn: any) => {
    // Filter by search query (if any)
    const matchesSearch = !searchQuery || 
      (checkIn.notes && checkIn.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (checkIn.objective?.title && checkIn.objective.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (checkIn.keyResult?.title && checkIn.keyResult.title.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by tab
    if (activeTab === 'my' && checkIn.userId !== user?.id) {
      return false;
    }
    
    // Filter by team
    if (teamFilter !== 'all') {
      // Would need to map checkIn.userId to a team
      // For now, we'll just show all if filtering by team
      // This would normally check if the user of the check-in is in the selected team
    }
    
    return matchesSearch;
  });

  const handleCreateCheckIn = async () => {
    try {
      if (!user?.id) {
        toast({
          title: 'Error',
          description: 'You must be logged in to create a check-in',
          variant: 'destructive',
        });
        return;
      }

      const checkInData = {
        userId: user.id,
        objectiveId: checkInType === 'objective' ? parseInt(selectedObjectiveId) : null,
        keyResultId: checkInType === 'keyResult' ? parseInt(selectedKeyResultId) : null,
        progress: parseInt(progress),
        notes: notes,
      };

      await apiRequest('POST', '/api/check-ins', checkInData);
      
      // Reset form and close dialog
      setCheckInType('objective');
      setSelectedObjectiveId('');
      setSelectedKeyResultId('');
      setProgress('0');
      setNotes('');
      setIsCreateDialogOpen(false);
      
      // Refresh check-ins
      queryClient.invalidateQueries({ queryKey: ['/api/check-ins'] });
      
      toast({
        title: 'Check-in created',
        description: 'Your check-in has been recorded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error creating check-in',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout title="Check-ins">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Check-ins</h1>
          <p className="text-gray-600">Track progress on objectives and key results</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsUpdateOKRDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Goal className="h-4 w-4" />
            Update OKRs
          </Button>
        
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Check-in
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Check-in</DialogTitle>
                <DialogDescription>
                  Record your progress on an objective or key result.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Check-in Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        checked={checkInType === 'objective'}
                        onChange={() => setCheckInType('objective')}
                        className="h-4 w-4 text-primary"
                      />
                      <span>Objective</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        checked={checkInType === 'keyResult'}
                        onChange={() => setCheckInType('keyResult')}
                        className="h-4 w-4 text-primary"
                      />
                      <span>Key Result</span>
                    </label>
                  </div>
                </div>
                
                {checkInType === 'objective' ? (
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Objective
                    </label>
                    <Select value={selectedObjectiveId} onValueChange={setSelectedObjectiveId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an objective" />
                      </SelectTrigger>
                      <SelectContent>
                        {objectives?.map(objective => (
                          <SelectItem key={objective.id} value={objective.id.toString()}>
                            {objective.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        Objective
                      </label>
                      <Select value={selectedObjectiveId} onValueChange={setSelectedObjectiveId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an objective" />
                        </SelectTrigger>
                        <SelectContent>
                          {objectives?.map(objective => (
                            <SelectItem key={objective.id} value={objective.id.toString()}>
                              {objective.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        Key Result
                      </label>
                      <Select 
                        value={selectedKeyResultId} 
                        onValueChange={setSelectedKeyResultId}
                        disabled={!selectedObjectiveId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedObjectiveId ? "Select a key result" : "Select an objective first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {keyResults?.map(keyResult => (
                            <SelectItem key={keyResult.id} value={keyResult.id.toString()}>
                              {keyResult.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Progress (%)
                  </label>
                  <div className="flex space-x-2 items-center">
                    <Input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="1"
                      value={progress}
                      onChange={(e) => setProgress(e.target.value)}
                      className="flex-1"
                    />
                    <span className="w-10 text-center">{progress}%</span>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <Textarea 
                    placeholder="Add any details about your progress..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateCheckIn}
                  disabled={
                    (checkInType === 'objective' && !selectedObjectiveId) ||
                    (checkInType === 'keyResult' && !selectedKeyResultId)
                  }
                >
                  Create Check-in
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main section tabs: Check-ins, Templates, Schedules, Metrics */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="mb-6">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="checkins" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Check-ins
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedules
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Metrics
          </TabsTrigger>
        </TabsList>

        {/* Check-ins tab content */}
        <TabsContent value="checkins" className="mt-0">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="all">All Check-ins</TabsTrigger>
                <TabsTrigger value="my">My Check-ins</TabsTrigger>
                <TabsTrigger value="team">Team Check-ins</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  className="pl-9"
                  placeholder="Search check-ins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams?.map((team: any) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {checkInsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-slate-200 rounded-full mr-3"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-24"></div>
                          <div className="h-3 bg-slate-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="h-6 bg-slate-200 rounded w-20"></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-16"></div>
                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-16"></div>
                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <div className="h-4 bg-slate-200 rounded w-16"></div>
                          <div className="h-4 bg-slate-200 rounded w-8"></div>
                        </div>
                        <div className="h-2 bg-slate-200 rounded w-full"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCheckIns && filteredCheckIns.length > 0 ? (
            <div className="space-y-4">
              {filteredCheckIns.map((checkIn: any) => (
                <CheckinCard key={checkIn.id} checkin={checkIn} />
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No check-ins found</AlertTitle>
              <AlertDescription>
                {searchQuery 
                  ? `No check-ins matching "${searchQuery}" were found. Try a different search.` 
                  : "No check-ins have been recorded yet. Create a new check-in to track progress."}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Templates tab content */}
        <TabsContent value="templates" className="mt-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold">Check-in Templates</h2>
              <p className="text-sm text-muted-foreground">Create and manage templates for different types of check-ins</p>
            </div>
            <Button onClick={() => window.location.href = '/templates'}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Manage Templates
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Weekly OKR Check-In</CardTitle>
                <CardDescription>Track weekly progress on objectives and key results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>1. What was your focus last week?</div>
                  <div>2. What are your goals this week?</div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/templates'}>
                  View Details
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">OKR Team Retro</CardTitle>
                <CardDescription>Retrospective for team OKR performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>1. What are we proud of this cycle?</div>
                  <div>2. What were the main challenges during this cycle?</div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/templates'}>
                  View Details
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">OKR Review</CardTitle>
                <CardDescription>Mid-term or end-of-cycle OKR review</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>1. Review current objectives and their progress</div>
                  <div>2. Identify achievements and blockers</div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/templates'}>
                  View Details
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Schedules tab content */}
        <TabsContent value="schedules" className="mt-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold">Check-in Schedules</h2>
              <p className="text-sm text-muted-foreground">Create and manage recurring check-in schedules</p>
            </div>
            <Button onClick={() => window.location.href = '/schedules'}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Manage Schedules
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadence</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Response Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Weekly Team OKR Update</TableCell>
                  <TableCell>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell>Every Monday at 9:00 AM</TableCell>
                  <TableCell>Apr 22, 2025</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Progress value={85} className="h-2 w-16 mr-2" />
                      <span className="text-sm">85%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => window.location.href = '/schedules'}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Monthly OKR Review</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      <XCircle className="h-3 w-3 mr-1" />
                      Paused
                    </Badge>
                  </TableCell>
                  <TableCell>Monthly on the 1st at 2:00 PM</TableCell>
                  <TableCell>May 1, 2025</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Progress value={0} className="h-2 w-16 mr-2" />
                      <span className="text-sm">0%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => window.location.href = '/schedules'}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Metrics tab content */}
        <TabsContent value="metrics" className="mt-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold">Check-in Metrics</h2>
              <p className="text-sm text-muted-foreground">Analytics on check-in responses and engagement</p>
            </div>
            <Select defaultValue="last30days">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 days</SelectItem>
                <SelectItem value="last30days">Last 30 days</SelectItem>
                <SelectItem value="last90days">Last 90 days</SelectItem>
                <SelectItem value="thisQuarter">This quarter</SelectItem>
                <SelectItem value="thisYear">This year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Response Rate</CardTitle>
                <CardDescription>Average completion rate for check-ins</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-3xl font-bold">78%</div>
                <div className="mt-4">
                  <Progress value={78} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Check-ins</CardTitle>
                <CardDescription>Number of check-ins submitted</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-3xl font-bold">143</div>
                <div className="text-sm text-muted-foreground mt-1">+12% from previous period</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Most Active Teams</CardTitle>
                <CardDescription>Teams with highest check-in activity</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Product Team</span>
                    <span className="text-sm">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Engineering Team</span>
                    <span className="text-sm">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Marketing Team</span>
                    <span className="text-sm">73%</span>
                  </div>
                  <Progress value={73} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Check-in Frequency by Day</CardTitle>
                <CardDescription>Distribution of check-ins across days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-2 pt-6">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                    const heights = [65, 85, 70, 90, 60, 30, 20];
                    return (
                      <div key={day} className="flex flex-col items-center">
                        <div 
                          className="w-12 bg-primary/90 rounded-t-md flex items-end justify-center text-white text-xs font-medium py-1"
                          style={{ height: `${heights[i]}%` }}
                        >
                          {heights[i]}%
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">{day}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Average Progress Updates</CardTitle>
                <CardDescription>Average progress reported in check-ins</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Product OKRs</span>
                      <span>63%</span>
                    </div>
                    <Progress value={63} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Engineering OKRs</span>
                      <span>71%</span>
                    </div>
                    <Progress value={71} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Marketing OKRs</span>
                      <span>52%</span>
                    </div>
                    <Progress value={52} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Sales OKRs</span>
                      <span>82%</span>
                    </div>
                    <Progress value={82} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Customer Success OKRs</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Update OKR Dialog */}
      <UpdateOKRDialog 
        open={isUpdateOKRDialogOpen} 
        onOpenChange={setIsUpdateOKRDialogOpen}
        onComplete={() => {
          toast({
            title: "OKRs Updated",
            description: "Your objectives and key results have been updated successfully."
          });
        }}
      />
    </DashboardLayout>
  );
};

export default CheckinsPage;
