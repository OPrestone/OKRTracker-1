import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/layouts/dashboard-layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Users, 
  Clock, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Edit, 
  Search, 
  ChevronRight, 
  MessageSquare,
  CalendarClock,
  Timer,
  UserCircle2,
  Target,
  Video,
  ExternalLink,
  Loader2
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { Meeting as DbMeeting } from "@shared/schema";

// Types for frontend representation of meetings
type MeetingStatus = "upcoming" | "completed" | "cancelled";
type MeetingPlatform = "google_meet" | "microsoft_teams" | "zoom" | "in_person" | "other";

interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  avatarUrl?: string;
  title?: string;
  role?: string;
  initials: string;
}

interface Objective {
  id: string;
  title: string;
  progress: number;
}

interface KeyResult {
  id: string;
  title: string;
  progress: number;
}

interface ActionItem {
  id: string;
  description: string;
  assignedToId: string;
  assignedTo?: string;
  completed: boolean;
  dueDate?: string;
  completedAt?: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  status: MeetingStatus;
  platform?: MeetingPlatform;
  meeting_link?: string;
  attendees: User[];
  agenda: string;
  notes?: string;
  action_items?: ActionItem[];
  related_okrs?: Objective[];
  related_key_results?: KeyResult[];
}

export default function OneOnOneMeetings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantContext();
  
  // Fetch all meetings
  const { 
    data: meetingsData, 
    isLoading: isLoadingMeetings, 
    error: meetingsError 
  } = useQuery({
    queryKey: ['/api/meetings', currentTenant?.id],
    enabled: !!currentTenant?.id,
  });
  
  // Fetch users to get attendee details
  const { 
    data: usersData 
  } = useQuery({
    queryKey: ['/api/users', currentTenant?.id],
    enabled: !!currentTenant?.id,
  });
  
  // Fetch objectives for related OKRs
  const {
    data: objectivesData
  } = useQuery({
    queryKey: ['/api/objectives', currentTenant?.id],
    enabled: !!currentTenant?.id,
  });
  
  // Fetch key results for related OKRs
  const {
    data: keyResultsData
  } = useQuery({
    queryKey: ['/api/key-results', currentTenant?.id],
    enabled: !!currentTenant?.id,
  });

  // Transform DB meeting data to frontend format
  const meetings: Meeting[] = React.useMemo(() => {
    if (!meetingsData || !Array.isArray(meetingsData)) return [];
    
    return meetingsData.map((dbMeeting: any) => {
      // Format the date and time
      const startTime = new Date(dbMeeting.scheduledStartTime);
      const endTime = new Date(dbMeeting.scheduledEndTime);
      const durationMinutes = dbMeeting.duration || 
        Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      
      // Format attendees
      let attendees: any[] = [];
      
      // Try to get attendees from the meeting object
      if (dbMeeting.attendees && Array.isArray(dbMeeting.attendees) && dbMeeting.attendees.length > 0) {
        attendees = dbMeeting.attendees.map((attendee: any) => {
          const user = attendee.user || {};
          const firstName = user.firstName || '';
          const lastName = user.lastName || '';
          const name = user.name || `${firstName} ${lastName}`.trim() || user.username || 'Unknown';
          
          return {
            id: user.id,
            name: name,
            role: user.title || '',
            avatarUrl: user.avatarUrl,
            initials: name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
          };
        });
      } 
      // If we have meetingsToUsers data, fetch user details from users data
      else if (dbMeeting.attendeeIds && Array.isArray(dbMeeting.attendeeIds) && usersData) {
        attendees = dbMeeting.attendeeIds
          .map((userId: string) => {
            const user = usersData.find((u: any) => u.id === userId);
            if (!user) return null;
            
            const firstName = user.firstName || '';
            const lastName = user.lastName || '';
            const name = user.name || `${firstName} ${lastName}`.trim() || user.username || 'Unknown';
            
            return {
              id: user.id,
              name: name,
              role: user.title || '',
              avatarUrl: user.avatarUrl,
              initials: name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
            };
          })
          .filter(Boolean);
      }
      
      // Format action items
      const actionItems = dbMeeting.actionItems?.map((item: any) => {
        const assignedUser = usersData?.find((u: any) => u.id === item.assignedToId);
        const assignedUserName = assignedUser ? 
          ((assignedUser.name || 
            `${assignedUser.firstName || ''} ${assignedUser.lastName || ''}`.trim() || 
            assignedUser.username) || 'Unknown') : 'Unknown';
        
        return {
          id: item.id,
          description: item.description,
          assignedToId: item.assignedToId,
          assignedTo: assignedUserName,
          completed: item.completed,
          dueDate: item.dueDate,
          completedAt: item.completedAt
        };
      }) || [];
      
      // Format related objectives
      const relatedObjectives = dbMeeting.relatedObjectives?.map((objective: any) => {
        return {
          id: objective.id,
          title: objective.title,
          progress: objective.progress || 0
        };
      }) || [];
      
      // Format related key results
      const relatedKeyResults = dbMeeting.relatedKeyResults?.map((keyResult: any) => {
        return {
          id: keyResult.id,
          title: keyResult.title,
          progress: keyResult.currentValue || 0
        };
      }) || [];
      
      return {
        id: dbMeeting.id,
        title: dbMeeting.title,
        date: format(startTime, 'yyyy-MM-dd'),
        time: format(startTime, 'h:mm a'),
        duration: `${durationMinutes} min`,
        status: dbMeeting.status as MeetingStatus,
        platform: dbMeeting.platform as MeetingPlatform,
        meeting_link: dbMeeting.meetingLink,
        attendees,
        agenda: dbMeeting.agenda,
        notes: dbMeeting.notes,
        action_items: actionItems,
        related_okrs: relatedObjectives,
        related_key_results: relatedKeyResults
      };
    });
  }, [meetingsData, usersData, objectivesData, keyResultsData]);

  // Filter meetings by status
  const upcomingMeetings = meetings.filter(meeting => meeting.status === "upcoming" || meeting.status === "scheduled");
  const completedMeetings = meetings.filter(meeting => meeting.status === "completed");
  const cancelledMeetings = meetings.filter(meeting => meeting.status === "cancelled");

  // New Meeting Dialog State
  const [newMeetingOpen, setNewMeetingOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingDuration, setMeetingDuration] = useState("30 min");
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [meetingPlatform, setMeetingPlatform] = useState<MeetingPlatform | "">("");
  const [meetingLink, setMeetingLink] = useState("");

  // Create meeting API mutation
  const createMeetingMutation = useMutation({
    mutationFn: async (meeting: any) => {
      const response = await apiRequest("POST", "/api/meetings", meeting);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      toast({
        title: "Meeting created",
        description: "Your meeting has been scheduled successfully.",
      });
      setNewMeetingOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create meeting",
        description: error.message || "There was an error creating your meeting. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Create a new meeting
  const handleCreateMeeting = () => {
    if (!meetingTitle || !meetingDate || !meetingTime || !meetingDuration || !meetingAgenda || selectedAttendees.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Parse time and date into proper format
    const durationMinutes = parseInt(meetingDuration.split(" ")[0]);
    
    // Construct the date objects
    const [year, month, day] = meetingDate.split("-").map(Number);
    const [hours, minutes] = meetingTime.split(":").map(Number);
    
    const startTime = new Date(year, month - 1, day, hours, minutes);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    
    // Create the meeting object to send to the API
    const meetingData = {
      title: meetingTitle,
      scheduledStartTime: startTime.toISOString(),
      scheduledEndTime: endTime.toISOString(),
      duration: durationMinutes,
      status: "scheduled", // Database uses 'scheduled' instead of 'upcoming'
      platform: meetingPlatform || undefined,
      meetingLink: meetingLink || undefined,
      agenda: meetingAgenda,
      tenantId: currentTenant?.id, // From tenant context
      attendees: selectedAttendees.map(attendeeName => {
        // Find user IDs from usersData based on name
        const user = usersData?.find((user: any) => {
          const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
          return fullName === attendeeName || user.name === attendeeName || user.username === attendeeName;
        });
        
        // Just return the ID (userId) if found
        return user?.id || null;
      }).filter(Boolean) // Only include attendees with valid user IDs
    };
    
    // Submit the meeting
    createMeetingMutation.mutate(meetingData);
  };

  // Reset form fields
  const resetForm = () => {
    setMeetingTitle("");
    setMeetingDate("");
    setMeetingTime("");
    setMeetingDuration("30 min");
    setMeetingAgenda("");
    setSelectedAttendees([]);
    setMeetingPlatform("");
    setMeetingLink("");
  };

  // Format meeting date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Show loading state
  if (isLoadingMeetings) {
    return (
      <DashboardLayout title="1:1 Meetings">
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h3 className="text-xl font-medium">Loading meetings...</h3>
        </div>
      </DashboardLayout>
    );
  }
  
  // Show error state
  if (meetingsError) {
    return (
      <DashboardLayout title="1:1 Meetings">
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          <div className="bg-red-50 text-red-600 p-6 rounded-lg max-w-md">
            <XCircle className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Error loading meetings</h3>
            <p className="text-red-700">{(meetingsError as Error)?.message || "There was a problem loading your meetings."}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/meetings'] })}
            >
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="1:1 Meetings">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">1:1 Meetings</h1>
          <p className="text-gray-600 mt-2">
            Schedule and manage 1:1 meetings to discuss OKR progress and provide support
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input placeholder="Search meetings..." className="pl-10" />
          </div>
          <Dialog open={newMeetingOpen} onOpenChange={setNewMeetingOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary" disabled={createMeetingMutation.isPending}>
                {createMeetingMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    New Meeting
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Schedule a New 1:1 Meeting</DialogTitle>
                <DialogDescription>
                  Create a new meeting to discuss OKR progress and provide support.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="time" className="text-right">
                    Time
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="duration" className="text-right">
                    Duration
                  </Label>
                  <Select value={meetingDuration} onValueChange={setMeetingDuration}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15 min">15 minutes</SelectItem>
                      <SelectItem value="30 min">30 minutes</SelectItem>
                      <SelectItem value="45 min">45 minutes</SelectItem>
                      <SelectItem value="60 min">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="attendees" className="text-right">
                    Attendees
                  </Label>
                  <Select
                    value={selectedAttendees[selectedAttendees.length - 1] || ""}
                    onValueChange={(value) => {
                      if (!selectedAttendees.includes(value)) {
                        setSelectedAttendees([...selectedAttendees, value]);
                      }
                    }}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Add attendees" />
                    </SelectTrigger>
                    <SelectContent>
                      {!usersData || !Array.isArray(usersData) || usersData.length === 0 ? (
                        <SelectItem value="" disabled>No users available</SelectItem>
                      ) : (
                        usersData.map((user: any) => {
                          const name = user.name || 
                            `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                            user.username || `User ${user.id.slice(-4)}`;
                          const role = user.title || user.role || '';
                          
                          return (
                            <SelectItem key={user.id} value={name}>
                              {name} {role ? `(${role})` : ''}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {selectedAttendees.length > 0 && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <div></div>
                    <div className="col-span-3 flex flex-wrap gap-2">
                      {selectedAttendees.map((attendee) => (
                        <Badge key={attendee} variant="secondary" className="pl-2 pr-1 py-1">
                          {attendee}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1 hover:bg-transparent"
                            onClick={() => setSelectedAttendees(selectedAttendees.filter(a => a !== attendee))}
                          >
                            <XCircle size={14} />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="platform" className="text-right">
                    Platform
                  </Label>
                  <Select 
                    value={meetingPlatform} 
                    onValueChange={(value) => {
                      setMeetingPlatform(value as MeetingPlatform);
                      
                      // Auto-generate a meeting link based on platform
                      if (value === "google_meet") {
                        const meetCode = Math.random().toString(36).substring(2, 8);
                        setMeetingLink(`https://meet.google.com/${meetCode}`);
                      } else if (value === "microsoft_teams") {
                        const meetId = Math.random().toString(36).substring(2, 10);
                        setMeetingLink(`https://teams.microsoft.com/l/meetup-join/meeting_${meetId}`);
                      } else if (value === "zoom") {
                        const meetId = Math.floor(Math.random() * 1000000000);
                        setMeetingLink(`https://zoom.us/j/${meetId}`);
                      } else {
                        setMeetingLink("");
                      }
                    }}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select meeting platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google_meet">Google Meet</SelectItem>
                      <SelectItem value="microsoft_teams">Microsoft Teams</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="in_person">In Person</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {meetingPlatform && meetingPlatform !== "in_person" && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="meeting_link" className="text-right">
                      Meeting Link
                    </Label>
                    <div className="col-span-3 flex gap-2">
                      <Input
                        id="meeting_link"
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        placeholder="Enter meeting link"
                        className="flex-1"
                      />
                      {meetingPlatform === "google_meet" && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon"
                          className="flex-shrink-0"
                          onClick={() => {
                            const meetCode = Math.random().toString(36).substring(2, 8);
                            setMeetingLink(`https://meet.google.com/${meetCode}`);
                          }}
                        >
                          <div className="w-5 h-5 flex items-center justify-center rounded-sm bg-blue-600 text-white text-xs font-bold">G</div>
                        </Button>
                      )}
                      {meetingPlatform === "microsoft_teams" && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon"
                          className="flex-shrink-0"
                          onClick={() => {
                            const meetId = Math.random().toString(36).substring(2, 10);
                            setMeetingLink(`https://teams.microsoft.com/l/meetup-join/meeting_${meetId}`);
                          }}
                        >
                          <div className="w-5 h-5 flex items-center justify-center rounded-sm bg-purple-600 text-white text-xs font-bold">T</div>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="agenda" className="text-right pt-2">
                    Agenda
                  </Label>
                  <Textarea
                    id="agenda"
                    value={meetingAgenda}
                    onChange={(e) => setMeetingAgenda(e.target.value)}
                    placeholder="Enter meeting agenda or topics to discuss..."
                    className="col-span-3"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setNewMeetingOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateMeeting}>Create Meeting</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="mt-4">
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming" className="px-6">
            Upcoming ({upcomingMeetings.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="px-6">
            Completed ({completedMeetings.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="px-6">
            Cancelled ({cancelledMeetings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <div className="grid gap-6 md:grid-cols-2">
            {upcomingMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
            {upcomingMeetings.length === 0 && (
              <div className="md:col-span-2 p-6 text-center bg-muted/30 rounded-lg border border-border">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
                <h3 className="mt-4 text-lg font-medium">No upcoming meetings</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Schedule a 1:1 meeting to discuss OKR progress and provide support.
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setNewMeetingOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="grid gap-6 md:grid-cols-2">
            {completedMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
            {completedMeetings.length === 0 && (
              <div className="md:col-span-2 p-6 text-center bg-muted/30 rounded-lg border border-border">
                <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
                <h3 className="mt-4 text-lg font-medium">No completed meetings</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Completed meetings will appear here.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="cancelled">
          <div className="grid gap-6 md:grid-cols-2">
            {cancelledMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
            {cancelledMeetings.length === 0 && (
              <div className="md:col-span-2 p-6 text-center bg-muted/30 rounded-lg border border-border">
                <XCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
                <h3 className="mt-4 text-lg font-medium">No cancelled meetings</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cancelled meetings will appear here.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

// Meeting Card Component
function MeetingCard({ meeting }: { meeting: Meeting }) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();

  // Status badge
  const getStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">Upcoming</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200">Cancelled</Badge>;
      default:
        return null;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get platform icon and color
  const getPlatformInfo = (platform?: MeetingPlatform) => {
    switch (platform) {
      case "google_meet":
        return {
          icon: <div className="w-4 h-4 flex items-center justify-center rounded-sm bg-blue-600 text-white text-xs font-bold">G</div>,
          label: "Google Meet",
          color: "text-blue-600"
        };
      case "microsoft_teams":
        return {
          icon: <div className="w-4 h-4 flex items-center justify-center rounded-sm bg-purple-600 text-white text-xs font-bold">T</div>,
          label: "Microsoft Teams",
          color: "text-purple-600"
        };
      case "zoom":
        return {
          icon: <div className="w-4 h-4 flex items-center justify-center rounded-sm bg-blue-500 text-white text-xs font-bold">Z</div>,
          label: "Zoom",
          color: "text-blue-500"
        };
      case "in_person":
        return {
          icon: <Users className="w-4 h-4 text-gray-600" />,
          label: "In Person",
          color: "text-gray-600"
        };
      default:
        return {
          icon: <Video className="w-4 h-4 text-gray-500" />,
          label: "Other",
          color: "text-gray-500"
        };
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200",
      meeting.status === "cancelled" && "opacity-70"
    )}>
      <div className="h-1.5 w-full bg-gradient-to-r from-primary to-primary/70"></div>
      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{meeting.title}</CardTitle>
          {getStatusBadge(meeting.status)}
        </div>
        <CardDescription>{formatDate(meeting.date)} at {meeting.time} • {meeting.duration}</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center mt-1 mb-3">
          <div className="flex -space-x-2 mr-2">
            {meeting.attendees.slice(0, 3).map((attendee) => (
              <Avatar key={attendee.id} className="border-2 border-background h-8 w-8">
                <AvatarImage src={attendee.avatarUrl} alt={attendee.name} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {attendee.initials}
                </AvatarFallback>
              </Avatar>
            ))}
            {meeting.attendees.length > 3 && (
              <Avatar className="border-2 border-background h-8 w-8">
                <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                  +{meeting.attendees.length - 3}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {meeting.attendees.length} {meeting.attendees.length === 1 ? 'attendee' : 'attendees'}
          </span>
        </div>

        <div className="space-y-2">
          {meeting.platform && (
            <div className="flex items-center">
              {getPlatformInfo(meeting.platform).icon}
              <span className={cn("text-sm ml-2", getPlatformInfo(meeting.platform).color)}>
                {getPlatformInfo(meeting.platform).label}
              </span>
              {meeting.meeting_link && (
                <a 
                  href={meeting.meeting_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-auto text-sm text-primary/80 hover:text-primary flex items-center"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Join
                </a>
              )}
            </div>
          )}
          
          <div className="flex items-start">
            <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm line-clamp-2">{meeting.agenda}</p>
          </div>
          
          {meeting.related_okrs && meeting.related_okrs.length > 0 && (
            <div className="flex items-start">
              <Target className="w-4 h-4 text-muted-foreground mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Related OKRs:</span>
                <div className="flex flex-wrap gap-2">
                  {meeting.related_okrs.map(okr => (
                    <Badge key={okr.id} variant="secondary" className="text-xs">
                      {okr.title}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between">
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-primary">
              View Details
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl">{meeting.title}</DialogTitle>
                {getStatusBadge(meeting.status)}
              </div>
              <DialogDescription>
                Meeting details and discussion points
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center">
                  <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="block text-muted-foreground">Date & Time</span>
                    <span>{formatDate(meeting.date)} at {meeting.time}</span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Timer className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="block text-muted-foreground">Duration</span>
                    <span>{meeting.duration}</span>
                  </div>
                </div>
                
                {meeting.platform && (
                  <div className="flex items-center">
                    <div className="text-sm flex items-center">
                      <span className="block text-muted-foreground mr-2">Platform</span>
                      <div className="flex items-center gap-1">
                        {getPlatformInfo(meeting.platform).icon}
                        <span className={getPlatformInfo(meeting.platform).color}>
                          {getPlatformInfo(meeting.platform).label}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {meeting.platform && meeting.meeting_link && meeting.status === "upcoming" && (
                <div className="mt-2 bg-primary/5 p-3 rounded-md border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={cn("mr-2", getPlatformInfo(meeting.platform).color)}>
                        {getPlatformInfo(meeting.platform).icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Meeting Link</h4>
                        <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                          {meeting.meeting_link}
                        </p>
                      </div>
                    </div>
                    <a 
                      href={meeting.meeting_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-primary text-white text-xs py-1 px-3 rounded-md hover:bg-primary/90 transition-colors flex items-center"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Join Meeting
                    </a>
                  </div>
                </div>
              )}
              
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  Attendees
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(!meeting.attendees || meeting.attendees.length === 0) ? (
                    <div className="text-sm text-muted-foreground italic">No attendees found</div>
                  ) : (
                    meeting.attendees.map((attendee) => (
                      <div 
                        key={attendee.id || `attendee-${Math.random()}`} 
                        className="flex items-center p-2 bg-muted/30 rounded-md"
                      >
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={attendee.avatarUrl} alt={attendee.name || 'Attendee'} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {attendee.initials || (attendee.name ? attendee.name[0] : '?')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{attendee.name || 'Unknown Attendee'}</div>
                          <div className="text-xs text-muted-foreground">{attendee.role || 'Team Member'}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-2">Agenda</h4>
                <p className="text-sm border rounded-md p-3 bg-muted/30">{meeting.agenda}</p>
              </div>
              
              {meeting.notes && (
                <div className="mt-2">
                  <h4 className="text-sm font-medium mb-2">Meeting Notes</h4>
                  <p className="text-sm border rounded-md p-3 bg-muted/30">{meeting.notes}</p>
                </div>
              )}
              
              {meeting.action_items && meeting.action_items.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-sm font-medium mb-2">Action Items</h4>
                  <div className="space-y-2">
                    {meeting.action_items.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-center p-2 border rounded-md bg-muted/30"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground mr-2" />
                        )}
                        <div className="flex-1">
                          <p className={cn(
                            "text-sm",
                            item.completed && "line-through text-muted-foreground"
                          )}>
                            {item.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Assigned to: {item.assignedTo}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {meeting.related_okrs && meeting.related_okrs.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-sm font-medium mb-2">Related OKRs</h4>
                  <div className="space-y-2">
                    {meeting.related_okrs.map((okr) => (
                      <div 
                        key={okr.id}
                        className="flex items-center justify-between p-2 border rounded-md bg-muted/30"
                      >
                        <div className="text-sm">{okr.title}</div>
                        <div className="flex items-center">
                          <span className="text-xs text-muted-foreground mr-2">
                            Progress: {okr.progress}%
                          </span>
                          <div className="w-20 h-2 bg-muted overflow-hidden rounded-full">
                            <div 
                              className={cn(
                                "h-full",
                                okr.progress >= 70 ? "bg-green-500" :
                                okr.progress >= 40 ? "bg-amber-500" : "bg-red-500"
                              )}
                              style={{ width: `${okr.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              {meeting.status === "upcoming" && (
                <>
                  <Button variant="outline" className="gap-1">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  {meeting.meeting_link ? (
                    <a 
                      href={meeting.meeting_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground text-white py-2 px-4 rounded-md flex items-center gap-1 transition-colors"
                    >
                      {meeting.platform && getPlatformInfo(meeting.platform).icon}
                      <span>Join Meeting</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  ) : (
                    <Button className="gap-1">
                      <UserCircle2 className="h-4 w-4" />
                      Join Meeting
                    </Button>
                  )}
                </>
              )}
              {meeting.status === "completed" && (
                <Button variant="outline" className="gap-1">
                  <Edit className="h-4 w-4" />
                  Edit Notes
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {meeting.status === "upcoming" && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              toast({
                title: "Reschedule requested",
                description: `You've requested to reschedule "${meeting.title}" with ${meeting.attendees && meeting.attendees[0]?.name ? meeting.attendees[0].name : 'attendees'}.`,
              });
              // In a real implementation, you'd open a scheduling dialog or redirect to a calendar page
            }}
          >
            Reschedule
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Circle Component for Action Items
function Circle({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-4 w-4 rounded-full border border-muted-foreground", className)}
    />
  );
}