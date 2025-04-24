import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from '@/hooks/use-toast';
import { 
  PlusCircle, 
  Search, 
  Filter,
  Clock,
  Bell,
  CalendarDays,
  UserCircle,
  Users,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  ArrowUpDown
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

// Schedule type definition
interface CheckInSchedule {
  id: number;
  name: string;
  status: 'active' | 'paused';
  cadence: {
    frequency: 'daily' | 'weekly' | 'monthly';
    day?: string; // day of week for weekly
    dayOfMonth?: number; // day of month for monthly
    time: string;
  };
  participants: {
    type: 'user' | 'team';
    id: number;
    name: string;
  }[];
  templateId: number;
  templateName: string;
  reminderBefore: number; // minutes before
  reminderFrequency: 'once' | 'daily';
  createdAt: string;
  lastRunAt?: string;
  nextRunAt: string;
  responseRate?: number; // percentage
}

// Mock data for check-in schedules
const mockSchedules: CheckInSchedule[] = [
  {
    id: 1,
    name: "Weekly Team OKR Update",
    status: "active",
    cadence: {
      frequency: "weekly",
      day: "Monday",
      time: "09:00:00"
    },
    participants: [
      { type: "team", id: 1, name: "Marketing Team" },
      { type: "team", id: 2, name: "Product Team" }
    ],
    templateId: 1,
    templateName: "Weekly OKR Check-In",
    reminderBefore: 60,
    reminderFrequency: "once",
    createdAt: "2023-09-01T12:00:00Z",
    lastRunAt: "2023-09-18T09:00:00Z",
    nextRunAt: "2023-09-25T09:00:00Z",
    responseRate: 85
  },
  {
    id: 2,
    name: "Daily Dev Standup",
    status: "active",
    cadence: {
      frequency: "daily",
      time: "10:00:00"
    },
    participants: [
      { type: "team", id: 3, name: "Engineering Team" }
    ],
    templateId: 2,
    templateName: "Daily Standup",
    reminderBefore: 15,
    reminderFrequency: "once",
    createdAt: "2023-09-02T12:00:00Z",
    lastRunAt: "2023-09-19T10:00:00Z",
    nextRunAt: "2023-09-20T10:00:00Z",
    responseRate: 92
  },
  {
    id: 3,
    name: "Monthly OKR Review",
    status: "paused",
    cadence: {
      frequency: "monthly",
      dayOfMonth: 1,
      time: "14:00:00"
    },
    participants: [
      { type: "user", id: 1, name: "John Smith" },
      { type: "user", id: 2, name: "Jane Doe" },
      { type: "user", id: 3, name: "Alice Johnson" }
    ],
    templateId: 3,
    templateName: "Monthly Review",
    reminderBefore: 1440, // 24 hours in minutes
    reminderFrequency: "daily",
    createdAt: "2023-09-03T12:00:00Z",
    nextRunAt: "2023-10-01T14:00:00Z"
  }
];

// Mock data for templates
const mockTemplates = [
  { id: 1, name: "Weekly OKR Check-In" },
  { id: 2, name: "Daily Standup" },
  { id: 3, name: "Monthly Review" },
  { id: 4, name: "OKR Team Retro" },
  { id: 5, name: "OKR Review" }
];

// Mock data for teams
const mockTeams = [
  { id: 1, name: "Marketing Team" },
  { id: 2, name: "Product Team" },
  { id: 3, name: "Engineering Team" },
  { id: 4, name: "Sales Team" },
  { id: 5, name: "Customer Success Team" }
];

// Mock data for users
const mockUsers = [
  { id: 1, name: "John Smith" },
  { id: 2, name: "Jane Doe" },
  { id: 3, name: "Alice Johnson" },
  { id: 4, name: "Bob Brown" },
  { id: 5, name: "Charlie Davis" }
];

// Column definitions for DataTable
import { ColumnDef } from "@tanstack/react-table";

const scheduleColumns: ColumnDef<CheckInSchedule>[] = [
  {
    accessorKey: "name",
    header: "Schedule Name",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.name}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge 
        variant={row.original.status === 'active' ? 'default' : 'secondary'}
        className={row.original.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
      >
        {row.original.status === 'active' ? 'Active' : 'Paused'}
      </Badge>
    ),
  },
  {
    accessorKey: "cadence",
    header: "Cadence",
    cell: ({ row }) => formatCadence(row.original.cadence),
  },
  {
    accessorKey: "participants",
    header: "Participants",
    cell: ({ row }) => formatParticipants(row.original.participants),
  },
  {
    accessorKey: "templateName",
    header: "Template",
    cell: ({ row }) => row.original.templateName,
  },
  {
    accessorKey: "nextRunAt",
    header: "Next Run",
    cell: ({ row }) => {
      const nextRunDate = new Date(row.original.nextRunAt);
      return nextRunDate.toLocaleDateString() + ' ' + formatTime(nextRunDate.toTimeString().split(' ')[0]);
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const schedule = row.original;
      return (
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => toggleScheduleStatus(schedule.id, schedule.status)}
          >
            {schedule.status === 'active' ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
          </Button>
          
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

const SchedulesPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Form state for creating/editing schedule
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    status: 'active' as 'active' | 'paused',
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    day: 'Monday',
    dayOfMonth: 1,
    time: '09:00',
    templateId: '',
    participantType: 'team' as 'team' | 'user',
    participants: [] as number[],
    reminderBefore: 60,
    reminderFrequency: 'once' as 'once' | 'daily'
  });
  
  // Placeholder for API fetch
  // const { data: schedules, isLoading } = useQuery({
  //   queryKey: ['/api/check-in-schedules'],
  // });
  
  // Using mock data for now
  const schedules = mockSchedules;
  const isLoading = false;
  
  // Placeholder for API fetch
  // const { data: templates } = useQuery({
  //   queryKey: ['/api/templates'],
  // });
  
  // Using mock data for now
  const templates = mockTemplates;
  
  // Placeholder for API fetch
  // const { data: teams } = useQuery({
  //   queryKey: ['/api/teams'],
  // });
  
  // Using mock data for now
  const teams = mockTeams;
  
  // Placeholder for API fetch
  // const { data: users } = useQuery({
  //   queryKey: ['/api/users'],
  // });
  
  // Using mock data for now
  const users = mockUsers;

  // Filter and sort schedules
  const filteredSchedules = schedules
    .filter(schedule => {
      // Filter by search query
      const matchesSearch = !searchQuery || 
        schedule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.templateName.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by tab
      if (activeTab === 'active' && schedule.status !== 'active') {
        return false;
      }
      if (activeTab === 'paused' && schedule.status !== 'paused') {
        return false;
      }
      
      return matchesSearch;
    })
    .sort((a, b) => {
      // Sort by selected field
      let valueA, valueB;
      
      switch (sortField) {
        case 'name':
          valueA = a.name;
          valueB = b.name;
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        case 'frequency':
          valueA = a.cadence.frequency;
          valueB = b.cadence.frequency;
          break;
        case 'nextRun':
          valueA = a.nextRunAt;
          valueB = b.nextRunAt;
          break;
        case 'responseRate':
          valueA = a.responseRate || 0;
          valueB = b.responseRate || 0;
          break;
        default:
          valueA = a.name;
          valueB = b.name;
      }
      
      // Apply sort order
      const comparison = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: string) => {
    if (field === sortField) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleScheduleStatus = (id: number, currentStatus: 'active' | 'paused') => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    // Here you would call the API to update the status
    // For now, we'll just show a toast
    toast({
      title: `Schedule ${newStatus === 'active' ? 'activated' : 'paused'}`,
      description: `The schedule has been ${newStatus === 'active' ? 'activated' : 'paused'} successfully.`
    });
  };

  const handleCreateSchedule = () => {
    if (!scheduleForm.name.trim()) {
      toast({
        title: "Error",
        description: "Schedule name is required",
        variant: "destructive"
      });
      return;
    }

    if (!scheduleForm.templateId) {
      toast({
        title: "Error",
        description: "Template selection is required",
        variant: "destructive"
      });
      return;
    }

    if (scheduleForm.participants.length === 0) {
      toast({
        title: "Error",
        description: "At least one participant is required",
        variant: "destructive"
      });
      return;
    }

    // Here you would call the API to create the schedule
    // For now, we'll just show a toast and close the dialog
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Schedule created",
      description: "The check-in schedule has been created successfully."
    });

    // Reset form
    setScheduleForm({
      name: '',
      status: 'active',
      frequency: 'weekly',
      day: 'Monday',
      dayOfMonth: 1,
      time: '09:00',
      templateId: '',
      participantType: 'team',
      participants: [],
      reminderBefore: 60,
      reminderFrequency: 'once'
    });
  };

  // Format the cadence info into a readable string
  const formatCadence = (cadence: CheckInSchedule['cadence']) => {
    let result = '';
    
    switch (cadence.frequency) {
      case 'daily':
        result = `Daily at ${formatTime(cadence.time)}`;
        break;
      case 'weekly':
        result = `Every ${cadence.day} at ${formatTime(cadence.time)}`;
        break;
      case 'monthly':
        const day = cadence.dayOfMonth;
        const suffix = getDaySuffix(day!);
        result = `Monthly on the ${day}${suffix} at ${formatTime(cadence.time)}`;
        break;
    }
    
    return result;
  };

  // Format time from 24h to 12h format
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Get day suffix (st, nd, rd, th)
  const getDaySuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  // Format the participants list into a readable string
  const formatParticipants = (participants: CheckInSchedule['participants']) => {
    if (participants.length === 0) return 'None';
    
    if (participants.length === 1) {
      return participants[0].name;
    }
    
    if (participants.length === 2) {
      return `${participants[0].name} and ${participants[1].name}`;
    }
    
    return `${participants[0].name}, ${participants[1].name}, and ${participants.length - 2} more`;
  };

  // Format reminder info into a readable string
  const formatReminder = (minutes: number, frequency: 'once' | 'daily') => {
    let timeStr;
    
    if (minutes < 60) {
      timeStr = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes === 60) {
      timeStr = '1 hour';
    } else if (minutes < 1440) {
      const hours = minutes / 60;
      timeStr = `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = minutes / 1440;
      timeStr = `${days} day${days !== 1 ? 's' : ''}`;
    }
    
    return `${timeStr} before${frequency === 'daily' ? ' (daily)' : ''}`;
  };

  return (
    <DashboardLayout title="Schedules">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Check-in Schedules</h1>
          <p className="text-muted-foreground">Create and manage regular check-in schedules for your teams</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Check-in Schedule</DialogTitle>
              <DialogDescription>
                Set up a recurring check-in schedule for teams or individuals.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <Input 
                    placeholder="Schedule name"
                    value={scheduleForm.name}
                    onChange={(e) => setScheduleForm({...scheduleForm, name: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">
                        {scheduleForm.status === 'active' ? 'Active' : 'Paused'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {scheduleForm.status === 'active' 
                          ? 'Check-ins will be sent automatically' 
                          : 'Check-ins are temporarily paused'}
                      </div>
                    </div>
                    <Switch
                      checked={scheduleForm.status === 'active'}
                      onCheckedChange={(checked) => 
                        setScheduleForm({...scheduleForm, status: checked ? 'active' : 'paused'})
                      }
                    />
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-2">
                <h3 className="font-medium mb-4 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Cadence: Set Recurrence Day and Time
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Frequency
                    </label>
                    <Select 
                      value={scheduleForm.frequency} 
                      onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                        setScheduleForm({...scheduleForm, frequency: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {scheduleForm.frequency === 'weekly' && (
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        Day of Week
                      </label>
                      <Select 
                        value={scheduleForm.day} 
                        onValueChange={(value) => setScheduleForm({...scheduleForm, day: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monday">Monday</SelectItem>
                          <SelectItem value="Tuesday">Tuesday</SelectItem>
                          <SelectItem value="Wednesday">Wednesday</SelectItem>
                          <SelectItem value="Thursday">Thursday</SelectItem>
                          <SelectItem value="Friday">Friday</SelectItem>
                          <SelectItem value="Saturday">Saturday</SelectItem>
                          <SelectItem value="Sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {scheduleForm.frequency === 'monthly' && (
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        Day of Month
                      </label>
                      <Select 
                        value={scheduleForm.dayOfMonth.toString()} 
                        onValueChange={(value) => 
                          setScheduleForm({...scheduleForm, dayOfMonth: parseInt(value)})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                            <SelectItem key={day} value={day.toString()}>
                              {day}{getDaySuffix(day)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                <div className="grid gap-2 mb-4">
                  <label className="text-sm font-medium text-gray-700">
                    Time
                  </label>
                  <Input 
                    type="time" 
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({...scheduleForm, time: e.target.value})}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="border-t pt-4 mt-2">
                <h3 className="font-medium mb-4 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Participants – Persons/Team that need to do the check-ins
                </h3>
                
                <div className="grid gap-4 mb-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Participant Type
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          checked={scheduleForm.participantType === 'team'}
                          onChange={() => setScheduleForm({...scheduleForm, participantType: 'team', participants: []})}
                          className="h-4 w-4 text-primary"
                        />
                        <span>Teams</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          checked={scheduleForm.participantType === 'user'}
                          onChange={() => setScheduleForm({...scheduleForm, participantType: 'user', participants: []})}
                          className="h-4 w-4 text-primary"
                        />
                        <span>Individual Users</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      {scheduleForm.participantType === 'team' ? 'Select Teams' : 'Select Users'}
                    </label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${scheduleForm.participantType === 'team' ? 'teams' : 'users'}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {scheduleForm.participantType === 'team' 
                          ? teams.map(team => (
                              <SelectItem key={team.id} value={team.id.toString()}>
                                {team.name}
                              </SelectItem>
                            ))
                          : users.map(user => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name}
                              </SelectItem>
                            ))
                        }
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground mt-1">
                      Multiple selection will be available in a future update.
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-2">
                <h3 className="font-medium mb-4 flex items-center">
                  <Bell className="h-4 w-4 mr-2" />
                  Reminders –Schedule reminders
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Remind
                    </label>
                    <Select 
                      value={scheduleForm.reminderBefore.toString()} 
                      onValueChange={(value) => 
                        setScheduleForm({...scheduleForm, reminderBefore: parseInt(value)})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select when to remind" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes before</SelectItem>
                        <SelectItem value="30">30 minutes before</SelectItem>
                        <SelectItem value="60">1 hour before</SelectItem>
                        <SelectItem value="120">2 hours before</SelectItem>
                        <SelectItem value="1440">1 day before</SelectItem>
                        <SelectItem value="2880">2 days before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Reminder Frequency
                    </label>
                    <Select 
                      value={scheduleForm.reminderFrequency} 
                      onValueChange={(value: 'once' | 'daily') => 
                        setScheduleForm({...scheduleForm, reminderFrequency: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="How often to remind" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">Once</SelectItem>
                        <SelectItem value="daily">Daily until completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-2">
                <h3 className="font-medium mb-4 flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Template-Allows you to select from the Active Predefined Templates
                </h3>
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Template
                  </label>
                  <Select 
                    value={scheduleForm.templateId} 
                    onValueChange={(value) => setScheduleForm({...scheduleForm, templateId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSchedule}>
                Create Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Schedules</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="paused">Paused</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            className="pl-9"
            placeholder="Search schedules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 rounded w-full"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      ) : (
        <DataTable
          columns={scheduleColumns}
          data={filteredSchedules}
          searchColumn="name"
          searchPlaceholder="Search schedules..."
        />
      )}
    </DashboardLayout>
  );
};

export default SchedulesPage;