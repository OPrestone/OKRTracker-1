import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Clock, Plus, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getRelativeMeetingDate, formatTime } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTenantContext } from "@/hooks/use-tenant-context";

// Form schema for meeting creation
const meetingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  duration: z.string().default("30"),
  agenda: z.string().optional(),
  attendeeId: z.string().optional(),
  platform: z.string().optional(),
  meetingLink: z.string().optional(),
});

type MeetingPlatform = "google_meet" | "microsoft_teams" | "zoom" | "in_person" | "other";

interface MeetingItemProps {
  userName: string;
  userRole: string;
  userAvatar?: string;
  date: string;
  time: string;
}

function MeetingItem({ userName, userRole, userAvatar, date, time }: MeetingItemProps) {
  return (
    <div className="flex items-start">
      <Avatar className="h-10 w-10">
        <AvatarImage src={userAvatar} alt={userName || ''} />
        <AvatarFallback>{userName ? userName.charAt(0) : '?'}</AvatarFallback>
      </Avatar>
      <div className="ml-3 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-neutral-900">{userName}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{userRole}</p>
          </div>
          <Badge 
            variant={date === "Today" ? "default" : "outline"}
            className={date === "Today" 
              ? "bg-primary-100 text-primary-800 hover:bg-primary-100" 
              : "bg-neutral-100 text-neutral-800 hover:bg-neutral-100"
            }
          >
            {date}
          </Badge>
        </div>
        <div className="mt-2 flex items-center text-xs text-neutral-600">
          <Clock className="h-4 w-4 text-neutral-400 mr-1" />
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
}

export function UpcomingMeetings() {
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantContext();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/meetings/upcoming'],
  });

  // Fetch user data for each meeting participant
  const { data: userData } = useQuery({
    queryKey: ['/api/users'],
  });

  // Fetch team members for attendee selection
  const { data: teamData } = useQuery({
    queryKey: ['/api/teams'],
  });

  const form = useForm<z.infer<typeof meetingSchema>>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: "",
      date: "",
      time: "",
      duration: "30",
      agenda: "",
      attendeeId: "",
      platform: "",
      meetingLink: "",
    },
  });

  const createMeetingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof meetingSchema>) => {
      const durationMinutes = parseInt(data.duration);
      const [year, month, day] = data.date.split("-").map(Number);
      const [hours, minutes] = data.time.split(":").map(Number);
      
      const startTime = new Date(year, month - 1, day, hours, minutes);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
      
      const meetingData = {
        title: data.title,
        scheduledStartTime: startTime.toISOString(),
        scheduledEndTime: endTime.toISOString(),
        duration: durationMinutes,
        status: "scheduled",
        platform: data.platform || undefined,
        meetingLink: data.meetingLink || undefined,
        agenda: data.agenda,
        tenantId: currentTenant?.id,
        attendeeIds: data.attendeeId ? [data.attendeeId] : []
      };
      
      return apiRequest("/api/meetings", {
        method: "POST",
        body: JSON.stringify(meetingData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Meeting Created",
        description: "Your meeting has been scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/meetings'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create meeting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof meetingSchema>) => {
    createMeetingMutation.mutate(data);
  };

  // Find user by ID
  const getUserById = (userId: number) => {
    if (!userData || !Array.isArray(userData)) return { fullName: "Loading...", role: "" };
    return userData.find((user: any) => user.id === userId) || { fullName: "Unknown", role: "" };
  };

  // Get all team members for attendee selection
  const getTeamMembers = () => {
    if (!teamData || !Array.isArray(teamData)) return [];
    return teamData.flatMap((team: any) => team.members || []);
  };

  return (
    <Card>
      <CardHeader className="px-5 py-4 flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-neutral-900">Upcoming 1:1 Meetings</CardTitle>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {isLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20 mt-1" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="mt-2 flex items-center">
                    <Skeleton className="h-4 w-4 mr-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : error ? (
          <div className="text-red-500">Error loading meetings</div>
        ) : (
          <>
            {data && Array.isArray(data) && data.slice(0, 3).map((meeting: any) => {
              const participant = getUserById(meeting.userId2);
              const meetingDate = new Date(meeting.startTime);
              
              return (
                <MeetingItem
                  key={meeting.id}
                  userName={participant.fullName}
                  userRole={participant.role}
                  userAvatar={participant.avatarUrl}
                  date={getRelativeMeetingDate(meeting.startTime)}
                  time={`${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}`}
                />
              );
            })}
          </>
        )}
      </CardContent>
      <CardFooter className="px-5 py-3 border-t border-neutral-200 flex justify-between items-center">
        <a href="/one-on-one" className="text-sm font-medium text-primary-600 hover:text-primary-800">
          View all meetings
        </a>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="px-3 py-1.5 h-auto text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Schedule meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Schedule a New 1:1 Meeting</DialogTitle>
              <DialogDescription>
                Create a new meeting to discuss progress and provide support.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="col-span-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">Title</FormLabel>
                          <FormControl className="col-span-3">
                            <Input placeholder="Meeting title" {...field} />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="attendeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attendee (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getTeamMembers().map((member: any) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name || member.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="google_meet">Google Meet</SelectItem>
                          <SelectItem value="microsoft_teams">Microsoft Teams</SelectItem>
                          <SelectItem value="zoom">Zoom</SelectItem>
                          <SelectItem value="in_person">In Person</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agenda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agenda (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Meeting agenda or topics to discuss..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMeetingMutation.isPending}
                  >
                    {createMeetingMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Meeting"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
