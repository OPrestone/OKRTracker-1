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
  ClipboardList
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { CheckIn, Objective, KeyResult, User } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';

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
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
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
    </DashboardLayout>
  );
};

export default CheckinsPage;
