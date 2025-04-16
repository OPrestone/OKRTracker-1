import React, { useState } from "react";
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
  ExternalLink
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type MeetingStatus = "upcoming" | "completed" | "cancelled";
type MeetingPlatform = "google_meet" | "microsoft_teams" | "zoom" | "in_person" | "other";

interface Meeting {
  id: number;
  title: string;
  date: string;
  time: string;
  duration: string;
  status: MeetingStatus;
  platform?: MeetingPlatform;
  meeting_link?: string;
  attendees: {
    id: number;
    name: string;
    role: string;
    avatar?: string;
    initials: string;
  }[];
  agenda: string;
  notes?: string;
  action_items?: {
    id: number;
    description: string;
    assigned_to: string;
    completed: boolean;
  }[];
  related_okrs?: {
    id: number;
    title: string;
    progress: number;
  }[];
}

export default function OneOnOneMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: 1,
      title: "Weekly OKR Check-in",
      date: "2025-04-17",
      time: "10:00 AM",
      duration: "30 min",
      status: "upcoming",
      platform: "google_meet",
      meeting_link: "https://meet.google.com/abc-defg-hij",
      attendees: [
        { id: 1, name: "John Doe", role: "Product Manager", initials: "JD" },
        { id: 2, name: "Sarah Kim", role: "Developer", initials: "SK" }
      ],
      agenda: "Discuss progress on Q2 product launch objectives and blockers",
      action_items: [],
      related_okrs: [
        { id: 101, title: "Launch mobile app v2.0", progress: 65 },
        { id: 102, title: "Increase user engagement by 25%", progress: 40 }
      ]
    },
    {
      id: 2,
      title: "Marketing Team OKR Review",
      date: "2025-04-15",
      time: "2:00 PM",
      duration: "45 min",
      status: "completed",
      attendees: [
        { id: 3, name: "Emily Chen", role: "Marketing Director", initials: "EC" },
        { id: 4, name: "Alex Johnson", role: "Marketing Specialist", initials: "AJ" }
      ],
      agenda: "Review Q1 marketing campaign results and plan Q2 initiatives",
      notes: "Team is on track with most objectives. Social media campaign exceeded targets by 15%. Need to allocate more resources to content creation.",
      action_items: [
        { id: 1, description: "Create content calendar for Q2", assigned_to: "Alex Johnson", completed: true },
        { id: 2, description: "Schedule meeting with sales team to align on Q2 goals", assigned_to: "Emily Chen", completed: false }
      ],
      related_okrs: [
        { id: 103, title: "Increase social media engagement by 30%", progress: 85 },
        { id: 104, title: "Generate 20% more leads from content marketing", progress: 60 }
      ]
    },
    {
      id: 3,
      title: "Engineering Sprint Planning",
      date: "2025-04-20",
      time: "11:00 AM",
      duration: "60 min",
      status: "upcoming",
      platform: "microsoft_teams",
      meeting_link: "https://teams.microsoft.com/l/meetup-join/meeting_abc123",
      attendees: [
        { id: 5, name: "Michael Wong", role: "Engineering Lead", initials: "MW" },
        { id: 6, name: "Laura Smith", role: "Senior Developer", initials: "LS" },
        { id: 7, name: "David Park", role: "QA Engineer", initials: "DP" }
      ],
      agenda: "Plan sprint tasks to align with quarterly OKRs, discuss technical debt reduction",
      related_okrs: [
        { id: 105, title: "Reduce API response time by 40%", progress: 25 },
        { id: 106, title: "Implement automated testing for core features", progress: 50 }
      ]
    },
    {
      id: 4,
      title: "Sales Performance Review",
      date: "2025-04-10",
      time: "9:00 AM",
      duration: "45 min",
      status: "cancelled",
      attendees: [
        { id: 8, name: "James Wilson", role: "Sales Director", initials: "JW" },
        { id: 9, name: "Rebecca Taylor", role: "Sales Representative", initials: "RT" }
      ],
      agenda: "Review individual sales targets and alignment with company OKRs",
      notes: "Meeting cancelled due to scheduling conflict. Rescheduled for next week.",
      related_okrs: [
        { id: 107, title: "Increase quarterly sales by 15%", progress: 30 },
        { id: 108, title: "Expand into 2 new market segments", progress: 20 }
      ]
    }
  ]);

  // Filter meetings by status
  const upcomingMeetings = meetings.filter(meeting => meeting.status === "upcoming");
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

  // Create a new meeting
  const handleCreateMeeting = () => {
    if (!meetingTitle || !meetingDate || !meetingTime || !meetingDuration || !meetingAgenda || selectedAttendees.length === 0) {
      alert("Please fill in all required fields");
      return;
    }

    const newMeeting: Meeting = {
      id: meetings.length + 1,
      title: meetingTitle,
      date: meetingDate,
      time: meetingTime,
      duration: meetingDuration,
      status: "upcoming",
      platform: meetingPlatform as MeetingPlatform || undefined,
      meeting_link: meetingLink || undefined,
      attendees: selectedAttendees.map((name, index) => ({
        id: 100 + index,
        name,
        role: "Team Member",
        initials: name.split(" ").map(n => n[0]).join("")
      })),
      agenda: meetingAgenda,
      action_items: [],
      related_okrs: []
    };

    setMeetings([...meetings, newMeeting]);
    setNewMeetingOpen(false);
    resetForm();
  };

  // Reset form fields
  const resetForm = () => {
    setMeetingTitle("");
    setMeetingDate("");
    setMeetingTime("");
    setMeetingDuration("30 min");
    setMeetingAgenda("");
    setSelectedAttendees([]);
  };

  // Format meeting date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

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
              <Button className="bg-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Meeting
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
                      <SelectItem value="John Doe">John Doe (Product Manager)</SelectItem>
                      <SelectItem value="Sarah Kim">Sarah Kim (Developer)</SelectItem>
                      <SelectItem value="Emily Chen">Emily Chen (Marketing Director)</SelectItem>
                      <SelectItem value="Alex Johnson">Alex Johnson (Marketing Specialist)</SelectItem>
                      <SelectItem value="Michael Wong">Michael Wong (Engineering Lead)</SelectItem>
                      <SelectItem value="Laura Smith">Laura Smith (Senior Developer)</SelectItem>
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
                <AvatarImage src={attendee.avatar} alt={attendee.name} />
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
              </div>
              
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  Attendees
                </h4>
                <div className="flex flex-wrap gap-2">
                  {meeting.attendees.map((attendee) => (
                    <div 
                      key={attendee.id} 
                      className="flex items-center p-2 bg-muted/30 rounded-md"
                    >
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={attendee.avatar} alt={attendee.name} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {attendee.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{attendee.name}</div>
                        <div className="text-xs text-muted-foreground">{attendee.role}</div>
                      </div>
                    </div>
                  ))}
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
                            Assigned to: {item.assigned_to}
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
                  <Button className="gap-1">
                    <UserCircle2 className="h-4 w-4" />
                    Join Meeting
                  </Button>
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
          <Button variant="outline" size="sm">
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